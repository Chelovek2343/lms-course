'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    const [openFaq, setOpenFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const faqs = [
        {
            q: 'Чем BAT отличается от обычных консалтинговых компаний?',
            a: 'Обычные компании берут $1000+ и сами подают за тебя в университеты, часто в сомнительные учебные заведения с которыми у них договорённости. Мы даём тебе авторскую методику — ты всё делаешь сам, понимаешь каждый шаг и экономишь деньги.',
        },
        {
            q: 'Что входит в курс за $99?',
            a: 'Полная авторская методика поступления: выбор университета, подготовка документов, написание мотивационного письма, прохождение интервью, подача заявки. Всё что нужно чтобы поступить самостоятельно.',
        },
        {
            q: 'Можно ли попробовать перед покупкой?',
            a: 'Да! Первый курс абсолютно бесплатный. Зарегистрируйся на платформе и получи доступ сразу.',
        },
        {
            q: 'Подходит ли методика для любой страны?',
            a: 'Методика охватывает университеты Европы, США, Канады и других стран. В курсе есть отдельные блоки по каждому направлению.',
        },
        {
            q: 'Что если у меня возникнут вопросы?',
            a: 'В каждом курсе есть материалы и файлы с подробными инструкциями. Также у нас есть сообщество в Telegram где можно задать вопрос.',
        },
    ];

    const advantages = [
        {
            icon: '💸',
            title: '$99 вместо $1000+',
            desc: 'Экономь деньги — не переплачивай посредникам за то что можешь сделать сам',
        },
        {
            icon: '🎓',
            title: 'Авторская методика',
            desc: 'Не шаблонные советы, а проверенная система которая реально работает',
        },
        {
            icon: '🏛️',
            title: 'Честный выбор универа',
            desc: 'Мы не ведём тебя в конкретный университет — ты сам выбираешь лучший вариант',
        },
        {
            icon: '⚡',
            title: 'Сразу к делу',
            desc: 'Никакой воды — только конкретные шаги, документы и инструкции',
        },
        {
            icon: '🔓',
            title: 'Бесплатный старт',
            desc: 'Первый курс бесплатно — убедись в качестве до покупки',
        },
        {
            icon: '📱',
            title: 'Учись в своём темпе',
            desc: 'Доступ к материалам 24/7 с любого устройства навсегда',
        },
    ];

    const reviews = [
        {
            name: 'Алина М.',
            country: '🇩🇪 Германия',
            text: 'Благодаря методике BAT я поступила в университет Мюнхена сама, без посредников. Сэкономила больше $900!',
            rating: 5,
        },
        {
            name: 'Дмитрий К.',
            country: '🇨🇦 Канада',
            text: 'Другие компании хотели взять $1200 и отправить меня в колледж который я даже не рассматривал. BAT дал реальные инструменты.',
            rating: 5,
        },
        {
            name: 'Сара Т.',
            country: '🇳🇱 Нидерланды',
            text: 'Очень чёткая структура. Прошла курс за 2 недели и подала документы в 3 университета одновременно.',
            rating: 5,
        },
        {
            name: 'Максим Р.',
            country: '🇦🇹 Австрия',
            text: 'Скептически относился к онлайн курсам, но методика реально рабочая. Поступил с первого раза.',
            rating: 5,
        },
    ];

    return (
        <div
            style={{
                background: '#060810',
                color: '#e2e8f0',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                overflowX: 'hidden',
            }}
        >
            {/* Navbar */}
            <nav
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background:
                        scrolled || mobileMenu
                            ? 'rgba(6,8,16,0.98)'
                            : 'transparent',
                    backdropFilter: scrolled ? 'blur(20px)' : 'none',
                    borderBottom: scrolled
                        ? '1px solid rgba(255,255,255,0.05)'
                        : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            background:
                                'linear-gradient(135deg, #00e5ff, #7c3aed)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '14px',
                            color: '#000',
                        }}
                    >
                        BAT
                    </div>
                    <span
                        style={{
                            fontWeight: '700',
                            fontSize: '18px',
                            color: '#fff',
                        }}
                    >
                        Consulting
                    </span>
                </div>

                {/* Десктоп меню */}
                <div
                    style={{
                        display: 'flex',
                        gap: '32px',
                        alignItems: 'center',
                        '@media(max-width:768px)': { display: 'none' },
                    }}
                    className="desktop-nav"
                >
                    {[
                        ['О нас', '#about'],
                        ['Преимущества', '#advantages'],
                        ['Цены', '#pricing'],
                        ['FAQ', '#faq'],
                    ].map(([label, href]) => (
                        <a
                            key={href}
                            href={href}
                            style={{
                                color: '#94a3b8',
                                fontSize: '14px',
                                textDecoration: 'none',
                            }}
                            onMouseEnter={(e) =>
                                (e.target.style.color = '#fff')
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.color = '#94a3b8')
                            }
                        >
                            {label}
                        </a>
                    ))}
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            padding: '10px 24px',
                            background:
                                'linear-gradient(135deg, #00e5ff, #7c3aed)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#000',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        Начать бесплатно
                    </button>
                </div>

                {/* Бургер кнопка */}
                <button
                    onClick={() => setMobileMenu(!mobileMenu)}
                    className="burger-btn"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'none',
                        flexDirection: 'column',
                        gap: '5px',
                        padding: '4px',
                    }}
                >
                    <span
                        style={{
                            width: '24px',
                            height: '2px',
                            background: '#fff',
                            display: 'block',
                            transition: 'all 0.3s',
                            transform: mobileMenu
                                ? 'rotate(45deg) translateY(7px)'
                                : 'none',
                        }}
                    />
                    <span
                        style={{
                            width: '24px',
                            height: '2px',
                            background: '#fff',
                            display: 'block',
                            transition: 'all 0.3s',
                            opacity: mobileMenu ? 0 : 1,
                        }}
                    />
                    <span
                        style={{
                            width: '24px',
                            height: '2px',
                            background: '#fff',
                            display: 'block',
                            transition: 'all 0.3s',
                            transform: mobileMenu
                                ? 'rotate(-45deg) translateY(-7px)'
                                : 'none',
                        }}
                    />
                </button>

                {/* Мобильное меню */}
                {mobileMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'rgba(6,8,16,0.98)',
                            padding: '20px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            borderBottom: '1px solid #1e2433',
                        }}
                        className="mobile-menu"
                    >
                        {[
                            ['О нас', '#about'],
                            ['Преимущества', '#advantages'],
                            ['Цены', '#pricing'],
                            ['FAQ', '#faq'],
                        ].map(([label, href]) => (
                            <a
                                key={href}
                                href={href}
                                onClick={() => setMobileMenu(false)}
                                style={{
                                    color: '#94a3b8',
                                    fontSize: '16px',
                                    textDecoration: 'none',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #1e2433',
                                }}
                            >
                                {label}
                            </a>
                        ))}
                        <button
                            onClick={() => router.push('/login')}
                            style={{
                                padding: '14px',
                                background:
                                    'linear-gradient(135deg, #00e5ff, #7c3aed)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#000',
                                fontWeight: '700',
                                fontSize: '15px',
                                cursor: 'pointer',
                                marginTop: '8px',
                            }}
                        >
                            Начать бесплатно
                        </button>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <section
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '120px 40px 80px',
                    textAlign: 'center',
                    position: 'relative',
                    background:
                        'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 70%)',
                }}
            className='hero-section'>
                {/* Grid bg */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        pointerEvents: 'none',
                    }}
                />

                <div
                    style={{
                        maxWidth: '800px',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <div
                        style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            marginBottom: '24px',
                            background: 'rgba(0,229,255,0.08)',
                            border: '1px solid rgba(0,229,255,0.2)',
                            borderRadius: '100px',
                            fontSize: '13px',
                            color: '#00e5ff',
                            fontWeight: '600',
                        }}
                    >
                        🎓 Поступи в зарубежный университет сам
                    </div>

                    <h1
                        style={{
                            fontSize: 'clamp(36px, 7vw, 72px)',
                            fontWeight: '900',
                            lineHeight: '1.1',
                            marginBottom: '24px',
                            color: '#fff',
                        }}
                    >
                        Забудь про{' '}
                        <span
                            style={{
                                background:
                                    'linear-gradient(135deg, #00e5ff, #7c3aed)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            посредников
                        </span>{' '}
                        за $1000
                    </h1>

                    <p
                        style={{
                            fontSize: '18px',
                            color: '#94a3b8',
                            lineHeight: '1.7',
                            marginBottom: '16px',
                            maxWidth: '600px',
                            margin: '0 auto 16px',
                        }}
                    >
                        Другие компании берут огромные деньги и ведут тебя в
                        университеты с которыми у них договорённости. Мы даём
                        тебе{' '}
                        <strong style={{ color: '#fff' }}>
                            авторскую методику
                        </strong>{' '}
                        — поступай сам, осознанно и в 10 раз дешевле.
                    </p>

                    <p
                        style={{
                            fontSize: '15px',
                            color: '#64748b',
                            marginBottom: '40px',
                        }}
                    >
                        Всё что делают они за $1000 — ты можешь сделать сам,
                        сидя за компьютером
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <button
                            onClick={() => router.push('/login')}
                            style={{
                                padding: '16px 36px',
                                background:
                                    'linear-gradient(135deg, #00e5ff, #7c3aed)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#000',
                                fontWeight: '800',
                                fontSize: '16px',
                                cursor: 'pointer',
                                boxShadow: '0 0 40px rgba(0,229,255,0.2)',
                            }}
                        className='hero-buttons'>
                            Попробовать бесплатно →
                        </button>
                        <a
                            href="#about"
                            style={{
                                padding: '16px 36px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontWeight: '600',
                                fontSize: '16px',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-block',
                            }}
                        >
                            Узнать больше
                        </a>
                    </div>

                    {/* Stats */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '40px',
                            justifyContent: 'center',
                            marginTop: '60px',
                            flexWrap: 'wrap',
                        }}
                    className='hero-stats'>
                        {[
                            ['$99', 'вместо $1000+'],
                            ['100%', 'авторская методика'],
                            ['0', 'скрытых платежей'],
                        ].map(([num, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: '900',
                                        color: '#00e5ff',
                                    }}
                                >
                                    {num}
                                </div>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: '#64748b',
                                    }}
                                >
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* О компании */}
            <section
                id="about"
                style={{
                    padding: '100px 40px',
                    maxWidth: '1100px',
                    margin: '0 auto',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '40px',
                        alignItems: 'center',
                    }}
                className="about-grid" >
                    <div>
                        <div
                            style={{
                                fontSize: '12px',
                                letterSpacing: '3px',
                                color: '#00e5ff',
                                fontWeight: '600',
                                marginBottom: '16px',
                                textTransform: 'uppercase',
                            }}
                        >
                            О компании BAT
                        </div>
                        <h2
                            style={{
                                fontSize: 'clamp(28px, 4vw, 44px)',
                                fontWeight: '900',
                                color: '#fff',
                                lineHeight: '1.2',
                                marginBottom: '24px',
                            }}
                        >
                            Мы не ведём тебя за руку в чужие интересы
                        </h2>
                        <p
                            style={{
                                color: '#94a3b8',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '20px',
                            }}
                        >
                            Большинство консалтинговых компаний имеют
                            договорённости с конкретными университетами. Они
                            получают комиссию за каждого студента — и их задача
                            не найти тебе лучший вариант, а привести тебя в
                            "нужное" место.
                        </p>
                        <p
                            style={{
                                color: '#94a3b8',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '20px',
                            }}
                        >
                            BAT работает иначе. Мы создали авторскую методику
                            которая даёт тебе{' '}
                            <strong style={{ color: '#fff' }}>
                                полный контроль
                            </strong>{' '}
                            над процессом поступления. Ты сам выбираешь
                            университет, сам подаёшь документы — и понимаешь
                            каждый шаг.
                        </p>
                        <p
                            style={{
                                color: '#94a3b8',
                                lineHeight: '1.8',
                                fontSize: '15px',
                            }}
                        >
                            Всё что делают компании за $1000 — это заполнить
                            форму и отправить документы. Мы научим тебя делать
                            это самостоятельно за{' '}
                            <strong style={{ color: '#00e5ff' }}>$99</strong>.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                        }}
                    >
                        {[
                            {
                                icon: '🏛️',
                                title: 'Любой университет',
                                desc: 'Не ограничены партнёрствами — работай с любым вузом мира',
                            },
                            {
                                icon: '📋',
                                title: 'Пошаговые инструкции',
                                desc: 'Чёткий план действий без лишней воды',
                            },
                            {
                                icon: '💰',
                                title: 'Честная цена',
                                desc: '$99 за всё — никаких скрытых платежей',
                            },
                            {
                                icon: '🌍',
                                title: 'Весь мир',
                                desc: 'Европа, США, Канада, Азия — любое направление',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                style={{
                                    background: '#0d1117',
                                    border: '1px solid #1e2433',
                                    borderRadius: '12px',
                                    padding: '20px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '28px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {item.icon}
                                </div>
                                <div
                                    style={{
                                        color: '#fff',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        marginBottom: '6px',
                                    }}
                                >
                                    {item.title}
                                </div>
                                <div
                                    style={{
                                        color: '#64748b',
                                        fontSize: '12px',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    {item.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Преимущества */}
            <section
                id="advantages"
                style={{
                    padding: '100px 40px',
                    background: 'rgba(0,229,255,0.02)',
                }}
            className="section-padding">
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div
                            style={{
                                fontSize: '12px',
                                letterSpacing: '3px',
                                color: '#00e5ff',
                                fontWeight: '600',
                                marginBottom: '16px',
                                textTransform: 'uppercase',
                            }}
                        >
                            Почему BAT
                        </div>
                        <h2
                            style={{
                                fontSize: 'clamp(28px, 4vw, 44px)',
                                fontWeight: '900',
                                color: '#fff',
                            }}
                        >
                            Всё что тебе нужно для поступления
                        </h2>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '20px',
                        }}
                    >
                        {advantages.map((adv, i) => (
                            <div
                                key={i}
                                style={{
                                    background: '#0d1117',
                                    border: '1px solid #1e2433',
                                    borderRadius: '16px',
                                    padding: '28px',
                                    borderTop: '2px solid rgba(0,229,255,0.3)',
                                    transition:
                                        'transform 0.2s, border-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform =
                                        'translateY(-4px)';
                                    e.currentTarget.style.borderColor =
                                        'rgba(0,229,255,0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                        'translateY(0)';
                                    e.currentTarget.style.borderColor =
                                        '#1e2433';
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '32px',
                                        marginBottom: '14px',
                                    }}
                                >
                                    {adv.icon}
                                </div>
                                <h3
                                    style={{
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {adv.title}
                                </h3>
                                <p
                                    style={{
                                        color: '#64748b',
                                        fontSize: '14px',
                                        lineHeight: '1.7',
                                    }}
                                >
                                    {adv.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Бесплатный курс */}
            <section
                style={{
                    padding: '100px 40px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(124,58,237,0.08))',
                        border: '1px solid rgba(0,229,255,0.2)',
                        borderRadius: '24px',
                        padding: '60px 40px',
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                        🎁
                    </div>
                    <h2
                        style={{
                            fontSize: 'clamp(24px, 4vw, 40px)',
                            fontWeight: '900',
                            color: '#fff',
                            marginBottom: '16px',
                        }}
                    >
                        Первый курс — бесплатно
                    </h2>
                    <p
                        style={{
                            color: '#94a3b8',
                            fontSize: '16px',
                            lineHeight: '1.7',
                            marginBottom: '32px',
                            maxWidth: '500px',
                            margin: '0 auto 32px',
                        }}
                    >
                        Не уверен? Попробуй бесплатно. Зарегистрируйся и получи
                        доступ к первому курсу прямо сейчас — без карты, без
                        обязательств.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            padding: '16px 40px',
                            background:
                                'linear-gradient(135deg, #00e5ff, #7c3aed)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#000',
                            fontWeight: '800',
                            fontSize: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 0 40px rgba(0,229,255,0.2)',
                        }}
                    >
                        Получить бесплатный доступ →
                    </button>
                </div>
            </section>

            {/* Цены */}
            <section
                id="pricing"
                style={{
                    padding: '100px 40px',
                    background: 'rgba(124,58,237,0.03)',
                }}
            >
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div
                            style={{
                                fontSize: '12px',
                                letterSpacing: '3px',
                                color: '#7c3aed',
                                fontWeight: '600',
                                marginBottom: '16px',
                                textTransform: 'uppercase',
                            }}
                        >
                            Цены
                        </div>
                        <h2
                            style={{
                                fontSize: 'clamp(28px, 4vw, 44px)',
                                fontWeight: '900',
                                color: '#fff',
                                marginBottom: '12px',
                            }}
                        >
                            Прозрачно и честно
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '15px' }}>
                            Никаких скрытых платежей и комиссий
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '24px',
                        }}
                    >
                        {/* Бесплатный */}
                        <div
                            style={{
                                background: '#0d1117',
                                border: '1px solid #1e2433',
                                borderRadius: '20px',
                                padding: '36px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                Старт
                            </div>
                            <div
                                style={{
                                    fontSize: '48px',
                                    fontWeight: '900',
                                    color: '#fff',
                                    marginBottom: '4px',
                                }}
                            >
                                $0
                            </div>
                            <div
                                style={{
                                    color: '#64748b',
                                    fontSize: '14px',
                                    marginBottom: '28px',
                                }}
                            >
                                Бесплатно навсегда
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    marginBottom: '32px',
                                }}
                            >
                                {[
                                    'Первый курс бесплатно',
                                    'Базовые материалы',
                                    'Доступ к сообществу',
                                ].map((f) => (
                                    <div
                                        key={f}
                                        style={{
                                            display: 'flex',
                                            gap: '10px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: '#10b981',
                                                fontSize: '14px',
                                            }}
                                        >
                                            ✓
                                        </span>
                                        <span
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {f}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => router.push('/login')}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'transparent',
                                    border: '1px solid #1e2433',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontWeight: '600',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                }}
                            >
                                Начать бесплатно
                            </button>
                        </div>

                        {/* Платный */}
                        <div
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(124,58,237,0.06))',
                                border: '1px solid rgba(0,229,255,0.3)',
                                borderRadius: '20px',
                                padding: '36px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background:
                                        'linear-gradient(135deg, #00e5ff, #7c3aed)',
                                    padding: '4px 12px',
                                    borderRadius: '100px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#000',
                                }}
                            >
                                ПОПУЛЯРНЫЙ
                            </div>
                            <div
                                style={{
                                    fontSize: '13px',
                                    color: '#00e5ff',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                Полный доступ
                            </div>
                            <div
                                style={{
                                    fontSize: '48px',
                                    fontWeight: '900',
                                    color: '#fff',
                                    marginBottom: '4px',
                                }}
                            >
                                $99
                            </div>
                            <div
                                style={{
                                    color: '#64748b',
                                    fontSize: '14px',
                                    marginBottom: '4px',
                                }}
                            >
                                <s style={{ color: '#374151' }}>$1000+</s> у
                                конкурентов
                            </div>
                            <div
                                style={{
                                    color: '#10b981',
                                    fontSize: '13px',
                                    marginBottom: '28px',
                                }}
                            >
                                Единоразовый платёж
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    marginBottom: '32px',
                                }}
                            >
                                {[
                                    'Полная авторская методика',
                                    'Все курсы платформы',
                                    'Пошаговые инструкции',
                                    'Шаблоны документов',
                                    'Поддержка в Telegram',
                                    'Обновления навсегда',
                                ].map((f) => (
                                    <div
                                        key={f}
                                        style={{
                                            display: 'flex',
                                            gap: '10px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: '#00e5ff',
                                                fontSize: '14px',
                                            }}
                                        >
                                            ✓
                                        </span>
                                        <span
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {f}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => router.push('/login')}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background:
                                        'linear-gradient(135deg, #00e5ff, #7c3aed)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#000',
                                    fontWeight: '800',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                }}
                            >
                                Купить за $99 →
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Отзывы */}
            <section
                style={{
                    padding: '100px 40px',
                    maxWidth: '1100px',
                    margin: '0 auto',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div
                        style={{
                            fontSize: '12px',
                            letterSpacing: '3px',
                            color: '#10b981',
                            fontWeight: '600',
                            marginBottom: '16px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Отзывы
                    </div>
                    <h2
                        style={{
                            fontSize: 'clamp(28px, 4vw, 44px)',
                            fontWeight: '900',
                            color: '#fff',
                        }}
                    >
                        Что говорят наши студенты
                    </h2>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '20px',
                    }}
                className='reviews-grid'>
                    {reviews.map((review, i) => (
                        <div
                            key={i}
                            style={{
                                background: '#0d1117',
                                border: '1px solid #1e2433',
                                borderRadius: '16px',
                                padding: '24px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '2px',
                                    marginBottom: '14px',
                                }}
                            >
                                {Array(review.rating)
                                    .fill('⭐')
                                    .map((s, i) => (
                                        <span
                                            key={i}
                                            style={{ fontSize: '14px' }}
                                        >
                                            {s}
                                        </span>
                                    ))}
                            </div>
                            <p
                                style={{
                                    color: '#94a3b8',
                                    fontSize: '14px',
                                    lineHeight: '1.7',
                                    marginBottom: '16px',
                                }}
                            >
                                "{review.text}"
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        color: '#fff',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                    }}
                                >
                                    {review.name}
                                </span>
                                <span
                                    style={{
                                        fontSize: '13px',
                                        color: '#64748b',
                                    }}
                                >
                                    {review.country}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section
                id="faq"
                style={{
                    padding: '100px 40px',
                    background: 'rgba(0,229,255,0.02)',
                }}
            className="section-padding">
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div
                            style={{
                                fontSize: '12px',
                                letterSpacing: '3px',
                                color: '#00e5ff',
                                fontWeight: '600',
                                marginBottom: '16px',
                                textTransform: 'uppercase',
                            }}
                        >
                            FAQ
                        </div>
                        <h2
                            style={{
                                fontSize: 'clamp(28px, 4vw, 44px)',
                                fontWeight: '900',
                                color: '#fff',
                            }}
                        >
                            Частые вопросы
                        </h2>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                style={{
                                    background: '#0d1117',
                                    border: `1px solid ${openFaq === i ? 'rgba(0,229,255,0.3)' : '#1e2433'}`,
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <button
                                    onClick={() =>
                                        setOpenFaq(openFaq === i ? null : i)
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '20px 24px',
                                        background: 'none',
                                        border: 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: '#fff',
                                            fontSize: '15px',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {faq.q}
                                    </span>
                                    <span
                                        style={{
                                            color: '#00e5ff',
                                            fontSize: '20px',
                                            flexShrink: 0,
                                            marginLeft: '16px',
                                        }}
                                    >
                                        {openFaq === i ? '−' : '+'}
                                    </span>
                                </button>
                                {openFaq === i && (
                                    <div style={{ padding: '0 24px 20px' }}>
                                        <p
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: '14px',
                                                lineHeight: '1.8',
                                            }}
                                        >
                                            {faq.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '100px 40px', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2
                        style={{
                            fontSize: 'clamp(28px, 5vw, 52px)',
                            fontWeight: '900',
                            color: '#fff',
                            lineHeight: '1.2',
                            marginBottom: '20px',
                        }}
                    >
                        Готов поступить{' '}
                        <span
                            style={{
                                background:
                                    'linear-gradient(135deg, #00e5ff, #7c3aed)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            сам?
                        </span>
                    </h2>
                    <p
                        style={{
                            color: '#94a3b8',
                            fontSize: '16px',
                            marginBottom: '36px',
                        }}
                    >
                        Начни с бесплатного курса прямо сейчас
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            padding: '18px 48px',
                            background:
                                'linear-gradient(135deg, #00e5ff, #7c3aed)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#000',
                            fontWeight: '800',
                            fontSize: '18px',
                            cursor: 'pointer',
                            boxShadow: '0 0 60px rgba(0,229,255,0.25)',
                        }}
                    >
                        Начать бесплатно →
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer
                style={{
                    padding: '40px',
                    borderTop: '1px solid #1e2433',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            background:
                                'linear-gradient(135deg, #00e5ff, #7c3aed)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '12px',
                            color: '#000',
                        }}
                    >
                        BAT
                    </div>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>
                        © 2026 BAT Consulting. Все права защищены.
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    {[
                        ['Telegram', 'https://t.me/'],
                        ['Instagram', 'https://instagram.com/'],
                    ].map(([name, href]) => (
                        <a
                            key={name}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#64748b',
                                fontSize: '14px',
                                textDecoration: 'none',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) =>
                                (e.target.style.color = '#00e5ff')
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.color = '#64748b')
                            }
                        >
                            {name}
                        </a>
                    ))}
                    <a
                        href="/login"
                        style={{
                            color: '#64748b',
                            fontSize: '14px',
                            textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => (e.target.style.color = '#00e5ff')}
                        onMouseLeave={(e) => (e.target.style.color = '#64748b')}
                    >
                        Войти
                    </a>
                </div>
            </footer>
        </div>
    );
}
