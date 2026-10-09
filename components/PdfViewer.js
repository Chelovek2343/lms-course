'use client';

import { useEffect, useRef, useState } from 'react';

const PDFJS_SRC =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function PdfViewer({ url }) {
    const containerRef = useRef(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        let pdfDoc = null;
        let observer = null;

        const loadPdfJs = () =>
            new Promise((resolve, reject) => {
                if (window.pdfjsLib) return resolve(window.pdfjsLib);
                const s = document.createElement('script');
                s.src = PDFJS_SRC;
                s.onload = () => resolve(window.pdfjsLib);
                s.onerror = () => reject(new Error('pdf.js не загрузился'));
                document.head.appendChild(s);
            });

        const run = async () => {
            try {
                setStatus('loading');
                const pdfjsLib = await loadPdfJs();
                pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

                pdfDoc = await pdfjsLib.getDocument({
                    url,
                    disableRange: true,
                    disableStream: true,
                }).promise;
                if (cancelled) return;

                const container = containerRef.current;
                if (!container) return;
                container.innerHTML = '';

                const first = await pdfDoc.getPage(1);
                const base = first.getViewport({ scale: 1 });
                const ratio = base.width / base.height;

                const rendering = new Set();

                const renderPage = async (wrap) => {
                    const n = Number(wrap.dataset.page);
                    if (wrap.dataset.done === '1' || rendering.has(n)) return;
                    rendering.add(n);
                    try {
                        const page = await pdfDoc.getPage(n);
                        const cssWidth = wrap.clientWidth || container.clientWidth;
                        const dpr = Math.min(window.devicePixelRatio || 1, 2);
                        const vp0 = page.getViewport({ scale: 1 });
                        const viewport = page.getViewport({
                            scale: (cssWidth / vp0.width) * dpr,
                        });
                        const canvas = wrap.querySelector('canvas');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        await page.render({
                            canvasContext: canvas.getContext('2d'),
                            viewport,
                        }).promise;
                        wrap.dataset.done = '1';
                    } catch (e) {
                        // отрисовку могли прервать при закрытии страницы
                    } finally {
                        rendering.delete(n);
                    }
                };

                const clearPage = (wrap) => {
                    const n = Number(wrap.dataset.page);
                    if (rendering.has(n) || wrap.dataset.done !== '1') return;
                    const canvas = wrap.querySelector('canvas');
                    canvas.width = 1;
                    canvas.height = 1;
                    wrap.dataset.done = '0';
                };

                observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) renderPage(entry.target);
                            else clearPage(entry.target);
                        });
                    },
                    { rootMargin: '800px 0px' },
                );

                for (let n = 1; n <= pdfDoc.numPages; n++) {
                    const wrap = document.createElement('div');
                    wrap.dataset.page = String(n);
                    wrap.dataset.done = '0';
                    wrap.style.cssText = `width:100%;aspect-ratio:${ratio};margin-bottom:8px;background:#fff;border-radius:10px;overflow:hidden;`;
                    const canvas = document.createElement('canvas');
                    canvas.style.cssText =
                        'width:100%;height:100%;display:block;object-fit:contain;';
                    wrap.appendChild(canvas);
                    container.appendChild(wrap);
                    observer.observe(wrap);
                }

                setStatus('ready');
            } catch (e) {
                console.error('PDF error:', e);
                if (!cancelled) setStatus('error');
            }
        };

        run();

        return () => {
            cancelled = true;
            if (observer) observer.disconnect();
            if (pdfDoc) pdfDoc.destroy();
        };
    }, [url]);

    return (
        <div>
            {status === 'loading' && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
                    Загрузка презентации...
                </p>
            )}
            {status === 'error' && (
                <div style={{ padding: '12px 0' }}>
                    <p style={{ color: '#ff9b9b', fontSize: '13px', marginBottom: '10px' }}>
                        Не удалось показать презентацию.
                    </p>
                    <button
                        onClick={() => window.open(url, '_blank')}
                        style={{
                            padding: '10px 18px',
                            background: 'transparent',
                            border: '1.5px solid rgba(111,163,224,0.5)',
                            borderRadius: '999px',
                            color: 'var(--accent-soft)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '700',
                            fontFamily: 'var(--sans)',
                        }}
                    >
                        Открыть в новой вкладке
                    </button>
                </div>
            )}
            <div ref={containerRef} />
        </div>
    );
}