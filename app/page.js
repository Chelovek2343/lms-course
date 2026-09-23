'use client';

import { useEffect } from 'react';

/* ===== НАСТРОЙКИ: заполните и опубликуйте заново ===== */
const CONFIG = {
  whatsapp: "",      // номер в международном формате без плюса, например "996555123456"
  telegram: "",      // ник без @, например "bat_consulting"
  instagram: "",     // полная ссылка на профиль
  offerUrl: "",      // ссылка на оферту
  privacyUrl: "",    // ссылка на политику конфиденциальности
  priceSomNote: "",  // например "≈ 8 700 сом"
  author: { name: "", role: "", bio: "", photo: "" },   // photo: data:image/... (встроенное изображение)
  testimonials: []   // [{ name: "Имя", note: "Страна, программа", text: "Текст отзыва" }]
};
/* ====================================================== */

const PAGE_CSS = `

:root{
  box-sizing:border-box;
  padding-top:env(safe-area-inset-top,0px);
  padding-bottom:env(safe-area-inset-bottom,0px);
  --topbar:#0a0d12;
  --navy:#02183a;
  --navy-deep:#00112a;
  --ink:#f3f6fb;
  --muted:#9db3d1;
  --dim:#6f88ab;
  --blue:#6b9fe6;
  --line:rgba(140,176,230,.16);
  --card:rgba(255,255,255,.035);
  --card-strong:rgba(70,120,200,.14);
  --white:#ffffff;
  --on-white:#06183a;
  --serif:"Source Serif 4","Georgia","Times New Roman",serif;
  --sans:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  color-scheme:dark;
}
html{scroll-padding-top:calc(env(safe-area-inset-top,0px) + 84px);scroll-behavior:smooth;background:var(--topbar);height:100%}
*,*::before,*::after{box-sizing:border-box}
body{
  margin:0;min-height:100%;
  font-family:var(--sans);font-size:17px;line-height:1.6;color:var(--ink);
  background-color:var(--navy);
  background-image:
    radial-gradient(900px 600px at 78% 8%,rgba(60,110,200,.16),transparent 70%),
    linear-gradient(180deg,#02183a 0%,#001430 55%,#00102a 100%);
  -webkit-font-smoothing:antialiased;
}
img,svg{max-width:100%}
a{color:inherit}
h1,h2,h3{font-family:var(--serif);font-weight:700;margin:0;letter-spacing:-.012em}
h1{font-size:clamp(2.35rem,5.4vw,4.3rem);line-height:1.05;font-weight:800}
h2{font-size:clamp(1.9rem,3.5vw,2.85rem);line-height:1.12}
h3{font-size:1.35rem;line-height:1.25}
em{font-style:italic;font-weight:600;color:var(--blue)}
p{margin:0}
.wrap{max-width:1180px;margin:0 auto;padding:0 clamp(20px,4vw,40px)}
.sec{padding-block:clamp(64px,9vw,112px);border-top:1px solid var(--line)}
.label{font-size:.95rem;font-weight:600;color:var(--blue);margin-bottom:14px}
.lead{color:var(--muted);font-size:1.12rem;max-width:62ch}
:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:6px}

/* buttons */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  font:600 1rem/1 var(--sans);text-decoration:none;cursor:pointer;
  padding:18px 30px;border-radius:999px;border:1px solid transparent;
  background:var(--white);color:var(--on-white);
  box-shadow:0 10px 34px rgba(80,140,255,.16);
  transition:box-shadow .2s,transform .2s,background .2s;
}
.btn:hover{box-shadow:0 12px 40px rgba(110,165,255,.32);transform:translateY(-1px)}
.btn-ghost{background:transparent;color:var(--ink);border-color:rgba(255,255,255,.3);box-shadow:none}
.btn-ghost:hover{background:rgba(255,255,255,.07);box-shadow:none}
.btn-sm{padding:12px 22px;font-size:.95rem;box-shadow:none}

/* header */
.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:var(--topbar);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:72px;gap:20px}
.brand{display:flex;align-items:center;gap:14px;text-decoration:none;font-weight:700;font-size:1.1rem;letter-spacing:-.01em}
.brand svg{height:34px;width:auto;display:block}
.nav{display:flex;gap:30px}
.nav a{text-decoration:none;color:var(--muted);font-size:.98rem;font-weight:500}
.nav a:hover{color:var(--ink)}
@media (max-width:860px){.nav{display:none}}

/* hero */
.hero{padding-block:clamp(48px,7vw,96px) clamp(56px,7vw,88px)}
.hero .grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr);gap:clamp(32px,5vw,72px);align-items:center}
@media (max-width:940px){.hero .grid{grid-template-columns:1fr}}
.seg{display:inline-flex;padding:4px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.03);margin-bottom:28px}
.seg button{font:600 .95rem/1 var(--sans);color:var(--muted);background:transparent;border:0;padding:11px 20px;border-radius:999px;cursor:pointer;transition:background .2s,color .2s}
.seg button[aria-pressed="true"]{background:var(--white);color:var(--on-white)}
[data-role="student"] .parent-only,[data-role="parent"] .student-only{display:none}
.hero .lead{margin-top:26px;max-width:56ch}
.hero .actions{display:flex;flex-wrap:wrap;align-items:center;gap:16px 22px;margin-top:38px}
.hero .fine{width:100%;color:var(--dim);font-size:.92rem;margin-top:-2px}

/* route card */
.route{border:1px solid var(--line);border-radius:22px;padding:28px 26px 26px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))}
.route h3{font-size:1.05rem;font-family:var(--sans);font-weight:600;color:var(--muted);margin-bottom:22px;display:flex;align-items:center;gap:10px}
.route ol{list-style:none;margin:0;padding:0;position:relative}
.route ol::before{content:"";position:absolute;left:13px;top:12px;bottom:14px;width:2px;background:linear-gradient(180deg,var(--blue),rgba(107,159,230,.15));transform-origin:top;animation:draw 1.5s .25s cubic-bezier(.2,.7,.2,1) both}
.route li{position:relative;padding:0 0 20px 46px;animation:pop .5s both}
.route li:last-child{padding-bottom:0}
.route li::before{content:attr(data-n);position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 .82rem/1 var(--sans);color:var(--on-white);background:var(--blue)}
.route li:nth-child(1){animation-delay:.3s}.route li:nth-child(2){animation-delay:.5s}.route li:nth-child(3){animation-delay:.7s}
.route li:nth-child(4){animation-delay:.9s}.route li:nth-child(5){animation-delay:1.1s}.route li:nth-child(6){animation-delay:1.3s}
.route b{display:block;font-weight:600;color:var(--ink);line-height:1.3}
.route span{display:block;color:var(--muted);font-size:.92rem;line-height:1.4;margin-top:2px}
@keyframes draw{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* facts strip */
.facts{border-top:1px solid var(--line)}
.facts .cols{display:grid;grid-template-columns:repeat(3,1fr)}
.facts .col{padding:38px clamp(16px,3vw,36px);border-right:1px solid var(--line)}
.facts .col:first-child{padding-left:0}
.facts .col:last-child{border-right:0}
.facts h3{color:var(--blue);font-size:1.7rem;margin-bottom:6px}
.facts p{color:var(--muted);font-size:.98rem;max-width:34ch}
@media (max-width:760px){
  .facts .cols{grid-template-columns:1fr}
  .facts .col{border-right:0;border-bottom:1px solid var(--line);padding-left:0}
  .facts .col:last-child{border-bottom:0}
}

/* pains */
.split{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(32px,6vw,88px);align-items:start}
@media (max-width:860px){.split{grid-template-columns:1fr}}
.pains{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.pains li{padding:20px 0;border-bottom:1px solid var(--line);font-size:1.08rem;color:var(--ink)}
.callout{margin-top:32px;padding:22px 24px;border-left:3px solid var(--blue);background:var(--card-strong);border-radius:0 14px 14px 0;font-family:var(--serif);font-size:1.25rem;line-height:1.4;font-weight:600}

/* steps */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:48px;border-top:1px solid var(--line)}
.step{padding:34px clamp(16px,2.4vw,32px) 8px 0}
.step + .step{padding-left:clamp(16px,2.4vw,32px);border-left:1px solid var(--line)}
.step .n{font-family:var(--serif);font-size:2.6rem;color:var(--blue);line-height:1;font-weight:700}
.step h3{margin:16px 0 8px}
.step p{color:var(--muted)}
@media (max-width:820px){
  .steps{grid-template-columns:1fr}
  .step,.step + .step{padding:28px 0;border-left:0;border-bottom:1px solid var(--line)}
}
.more{margin-top:34px;color:var(--muted)}
.more a{color:var(--ink);font-weight:600}

/* modules */
.mods{display:grid;grid-template-columns:1fr 1fr;gap:0 clamp(24px,4vw,56px);margin-top:44px;align-items:start}
@media (max-width:860px){.mods{grid-template-columns:1fr}}
details{border-bottom:1px solid var(--line)}
details:first-child{border-top:1px solid var(--line)}
summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:16px;padding:20px 0;font-weight:600;font-size:1.05rem}
summary::-webkit-details-marker{display:none}
summary .num{flex:none;width:34px;font-family:var(--serif);font-size:1.15rem;color:var(--blue);font-weight:700}
summary .plus{margin-left:auto;flex:none;width:22px;height:22px;position:relative;color:var(--muted)}
summary .plus::before,summary .plus::after{content:"";position:absolute;left:3px;right:3px;top:10px;height:2px;background:currentColor;border-radius:2px;transition:transform .25s}
summary .plus::after{transform:rotate(90deg)}
details[open] summary .plus::after{transform:rotate(0)}
details .body{padding:0 38px 22px 50px;color:var(--muted)}
.faq details .body{padding:0 38px 24px 0}
.faq summary{padding:22px 0}

.outcome{margin-top:64px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(24px,5vw,72px)}
@media (max-width:860px){.outcome{grid-template-columns:1fr}}
.ticks{list-style:none;margin:0;padding:0}
.ticks li{position:relative;padding:14px 0 14px 34px;border-bottom:1px solid var(--line);color:var(--ink)}
.ticks li:first-child{border-top:1px solid var(--line)}
.ticks li::before{content:"";position:absolute;left:4px;top:20px;width:8px;height:14px;border-right:2px solid var(--blue);border-bottom:2px solid var(--blue);transform:rotate(40deg) scale(.9)}

/* budget */
.tablewrap{overflow-x:auto;margin-top:36px;border:1px solid var(--line);border-radius:18px}
table{width:100%;border-collapse:collapse;min-width:520px}
th,td{padding:18px 22px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
th{font-weight:600;color:var(--muted);font-size:.92rem;background:rgba(255,255,255,.03)}
td:first-child{font-weight:600}
.note{margin-top:24px;padding:24px 26px;border:1px solid var(--line);border-radius:18px;background:var(--card-strong);color:var(--ink)}
.note b{font-family:var(--serif);font-size:1.15rem;display:block;margin-bottom:6px}
.note p{color:var(--muted)}
.small{color:var(--dim);font-size:.9rem;margin-top:14px}

/* honesty */
.duo{display:grid;grid-template-columns:1fr 1fr;margin-top:44px;border:1px solid var(--line);border-radius:22px;overflow:hidden}
@media (max-width:760px){.duo{grid-template-columns:1fr}}
.duo > div{padding:34px clamp(22px,3vw,40px)}
.duo .a{background:rgba(255,255,255,.02);border-right:1px solid var(--line)}
@media (max-width:760px){.duo .a{border-right:0;border-bottom:1px solid var(--line)}}
.duo .b{background:var(--card-strong)}
.duo h3{font-family:var(--sans);font-size:.95rem;font-weight:600;margin-bottom:14px}
.duo .a h3{color:var(--dim)}
.duo .b h3{color:var(--blue)}
.duo .a p{color:var(--dim)}
.duo .b p{color:var(--ink)}

/* author + reviews (rendered from config) */
.author{display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center;margin-top:36px}
.avatar{width:128px;height:128px;border-radius:50%;background:var(--card-strong);border:1px solid var(--line);object-fit:cover;display:grid;place-items:center;font:700 2.4rem var(--serif);color:var(--blue)}
@media (max-width:640px){.author{grid-template-columns:1fr}}
.quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:36px}
.quote{padding:26px;border:1px solid var(--line);border-radius:18px;background:var(--card)}
.quote p{font-family:var(--serif);font-size:1.12rem;line-height:1.5}
.quote small{display:block;margin-top:14px;color:var(--muted)}

/* compare */
.compare th:first-child,.compare td:first-child{color:var(--muted);font-weight:500}
.compare th.us,.compare td.us{background:var(--card-strong)}
.compare th.us{color:var(--blue)}

/* pricing */
.plans{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:44px}
@media (max-width:860px){.plans{grid-template-columns:1fr}}
.plan{padding:36px clamp(24px,3vw,40px);border:1px solid var(--line);border-radius:24px;background:var(--card);display:flex;flex-direction:column}
.plan.main{background:linear-gradient(180deg,rgba(90,140,230,.2),rgba(90,140,230,.06));border-color:rgba(107,159,230,.5)}
.plan .tag{color:var(--blue);font-weight:600;font-size:.9rem;margin-bottom:10px}
.plan .price{font-family:var(--serif);font-size:3.1rem;font-weight:800;line-height:1;margin:14px 0 4px}
.plan .per{color:var(--muted);font-size:.95rem;margin-bottom:24px}
.plan ul{list-style:none;padding:0;margin:0 0 30px;display:grid;gap:12px;flex:1}
.plan li{position:relative;padding-left:26px;color:var(--ink)}
.plan li::before{content:"";position:absolute;left:3px;top:7px;width:6px;height:11px;border-right:2px solid var(--blue);border-bottom:2px solid var(--blue);transform:rotate(40deg)}
.plan .btn{align-self:flex-start}

.guarantee{margin-top:44px;padding:30px clamp(22px,3vw,40px);border-left:3px solid var(--blue);background:var(--card-strong);border-radius:0 20px 20px 0}
.guarantee h3{margin-bottom:10px}
.guarantee p{color:var(--muted);max-width:70ch}

.faq{max-width:840px;margin-top:40px}
.cta{text-align:left}
.cta .actions{display:flex;flex-wrap:wrap;gap:16px;margin-top:34px}

footer{background:var(--topbar);border-top:1px solid var(--line);padding:40px 0;color:var(--dim);font-size:.93rem}
footer .wrap{display:flex;flex-wrap:wrap;gap:16px 32px;justify-content:space-between;align-items:center}
footer nav{display:flex;flex-wrap:wrap;gap:8px 24px}
footer a{color:var(--muted);text-decoration:none}
footer a:hover{color:var(--ink)}

/* dialog */
dialog{border:1px solid var(--line);border-radius:24px;padding:0;background:#071d40;color:var(--ink);width:min(520px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto}
dialog::backdrop{background:rgba(2,8,20,.72);backdrop-filter:blur(3px)}
dialog[open]{animation:dlg .22s ease-out}
@keyframes dlg{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
.dlg{padding:30px 28px 28px;position:relative}
.dlg h3{font-size:1.5rem;padding-right:36px}
.dlg .lead{font-size:1rem;margin-top:8px}
.dlg .close{position:absolute;right:14px;top:14px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.07);color:var(--ink);font-size:1.3rem;cursor:pointer}
.msg{margin:22px 0 18px;padding:16px 18px;border:1px dashed rgba(157,179,209,.4);border-radius:14px;color:var(--ink);font-size:.98rem;background:rgba(255,255,255,.03)}
.dlg .row{display:flex;flex-wrap:wrap;gap:12px}
.dlg .copy{margin-top:14px;background:none;border:0;color:var(--muted);font:500 .95rem var(--sans);cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:6px 0}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .route ol::before,.route li,dialog[open]{animation:none}
  .btn{transition:none}
}

`;

const PAGE_HTML = `
<header class="top">
  <div class="wrap">
    <a class="brand" href="#top" aria-label="BAT Consulting — на главную">
      <svg viewBox="0 0 132 44" role="img" aria-hidden="true">
        <path d="M103 15 L128 3 L114 27 L109 18 Z" fill="#fff"/>
        <path d="M103 15 L109 18 L114 27" fill="none" stroke="#0a0d12" stroke-width="1.2"/>
        <text x="2" y="36" font-family="Inter,Arial,sans-serif" font-weight="800" font-style="italic" font-size="34" fill="#fff" letter-spacing="-1">BAT</text>
        <path d="M2 41 C30 44 60 42 92 36" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <span>BAT Consulting</span>
    </a>
    <nav class="nav" aria-label="Разделы">
      <a href="#program">Программа</a>
      <a href="#budget">Бюджет</a>
      <a href="#pricing">Цены</a>
      <a href="#faq">Вопросы</a>
    </nav>
    <div style="display:flex;gap:10px;align-items:center">
      <a class="btn btn-sm btn-ghost" href="/login">Войти</a>
      <button class="btn btn-sm" data-cta="consult" type="button">Заявка</button>
    </div>
  </div>
</header>

<main id="top">

<!-- HERO -->
<section class="hero">
  <div class="wrap grid">
    <div>
      <div class="seg" role="group" aria-label="Кто вы">
        <button type="button" data-set-role="student" aria-pressed="true">Я школьник</button>
        <button type="button" data-set-role="parent" aria-pressed="false">Я родитель</button>
      </div>

      <h1 class="student-only">Не отличник и не миллионер? <em>Тебе тоже есть куда поступать</em></h1>
      <h1 class="parent-only">Поступление ребёнка за границу: <em>без мошенников и сюрпризов в бюджете</em></h1>

      <p class="lead student-only">Пошаговая дорожная карта на 13 модулей: как выбрать страну и вуз под свои оценки, язык и бюджет, собрать документы и получить визу. Университет выбираешь ты сам.</p>
      <p class="lead parent-only">Понятный план для семьи: с чего начать, сколько это стоит на самом деле и как не потерять год. Решение остаётся за вашей семьёй.</p>

      <div class="actions">
        <button class="btn" data-cta="course" type="button">Получить курс за $99</button>
        <button class="btn btn-ghost" data-cta="consult" type="button">Бесплатная консультация</button>
        <p class="fine">Без обязательств · ответ за 24 часа</p>
      </div>
    </div>

    <aside class="route" aria-label="Маршрут поступления">
      <h3>Маршрут поступления</h3>
      <ol>
        <li data-n="1"><b>Страна и бюджет</b><span>Сколько это стоит на самом деле</span></li>
        <li data-n="2"><b>Список из 3–5 вузов</b><span>Желаемые, реалистичные, запасные</span></li>
        <li data-n="3"><b>Требования и язык</b><span>GPA, IELTS/TOEFL, дедлайны</span></li>
        <li data-n="4"><b>Документы</b><span>Переводы, апостиль, письма</span></li>
        <li data-n="5"><b>Заявки</b><span>Подача и отслеживание статуса</span></li>
        <li data-n="6"><b>Виза и переезд</b><span>Всё до вылета</span></li>
      </ol>
    </aside>
  </div>
</section>

<!-- FACTS -->
<section class="facts" aria-label="Коротко о курсе">
  <div class="wrap cols">
    <div class="col"><h3>13 модулей</h3><p>От выбора страны до визы и переезда, с шаблонами документов.</p></div>
    <div class="col"><h3>Один платёж</h3><p>$99 за курс «Дорожная карта», без скрытых доплат.</p></div>
    <div class="col"><h3>Несколько стран</h3><p>Подаёшь документы параллельно, а не ждёшь ответа из одной страны.</p></div>
  </div>
</section>

<!-- PAINS -->
<section class="sec">
  <div class="wrap split">
    <div>
      <p class="label">Знакомо?</p>
      <h2>С поступлением за границу обычно так</h2>
      <div class="callout">Один неправильно выбранный вуз стоит дороже, чем этот курс.</div>
    </div>
    <ul class="pains">
      <li>Непонятно, с чего начать: страна, вуз, язык или бюджет.</li>
      <li>В Telegram десять мнений, и все разные.</li>
      <li>Страшно нарваться на агентство, которое поведёт не туда, куда нужно вам.</li>
      <li>Неясно, сколько это стоит на самом деле: обучение, жильё, виза, билеты, страховка.</li>
      <li>Один пропущенный дедлайн, и год потерян.</li>
    </ul>
  </div>
</section>

<!-- HOW -->
<section class="sec" id="how">
  <div class="wrap">
    <p class="label">Как это работает</p>
    <h2>Три шага от хаоса к плану</h2>
    <div class="steps">
      <div class="step"><div class="n">1</div><h3>Получаете доступ</h3><p>Модули 1–2 открываются сразу, остальные по дням. Сразу видно формат и качество.</p></div>
      <div class="step"><div class="n">2</div><h3>Проходите и заполняете свой план</h3><p>В каждом модуле практическое задание: список вузов, бюджет, документы.</p></div>
      <div class="step"><div class="n">3</div><h3>Подаёте заявки</h3><p>Застряли: есть чат в Telegram. Курс не подошёл: бесплатный созвон 15 минут.</p></div>
    </div>
    <p class="more">Хотите, чтобы всё делали вместе с вами? Есть <a href="#pricing">полное сопровождение</a>.</p>
  </div>
</section>

<!-- PROGRAM -->
<section class="sec" id="program">
  <div class="wrap">
    <p class="label">Не курс с видео</p>
    <h2>13 модулей: от выбора страны до переезда</h2>
    <p class="lead" style="margin-top:18px">Большинство гайдов по поступлению — общие советы, которые можно найти бесплатно. Здесь система, шаблоны и практические задания. Нажмите на модуль, чтобы увидеть, что внутри.</p>

    <div class="mods">
      <div>
        <details><summary><span class="num">1</span>Введение<span class="plus"></span></summary><div class="body">Как устроено поступление и карта всего процесса от начала до переезда.</div></details>
        <details><summary><span class="num">2</span>Список документов<span class="plus"></span></summary><div class="body">Какие документы нужны и куда с ними идти.</div></details>
        <details><summary><span class="num">3</span>Выбор университета<span class="plus"></span></summary><div class="body">Как собрать список из 3–5 вузов и разделить его на желаемые, реалистичные и запасные.</div></details>
        <details><summary><span class="num">4</span>Требования<span class="plus"></span></summary><div class="body">GPA, IELTS/TOEFL, SAT и случаи, когда экзамены не нужны. Разбор на примерах США, Италии и Китая.</div></details>
        <details><summary><span class="num">5</span>Подготовка документов<span class="plus"></span></summary><div class="body">Апостиль, переводы, легализация: что делать первым, потому что зависит от третьих лиц.</div></details>
        <details><summary><span class="num">6</span>Мотивационное письмо<span class="plus"></span></summary><div class="body">Структура, типичные ошибки и примеры.</div></details>
        <details><summary><span class="num">7</span>Резюме (CV)<span class="plus"></span></summary><div class="body">Как написать сильное резюме без опыта работы, с примерами.</div></details>
      </div>
      <div>
        <details><summary><span class="num">8</span>Рекомендательные письма<span class="plus"></span></summary><div class="body">Кто пишет, как попросить и шаблоны для рекомендателей.</div></details>
        <details><summary><span class="num">9</span>Подача заявок<span class="plus"></span></summary><div class="body">Common App, порталы вузов, отслеживание статуса. С разбором по странам.</div></details>
        <details><summary><span class="num">10</span>Стипендии и гранты<span class="plus"></span></summary><div class="body">Виды стипендий, где их искать и честный план Б.</div></details>
        <details><summary><span class="num">11</span>После поступления<span class="plus"></span></summary><div class="body">Offer Letter, депозит и что подтверждать в первую очередь.</div></details>
        <details><summary><span class="num">12</span>Виза<span class="plus"></span></summary><div class="body">Документы, собеседование и самые частые причины отказов.</div></details>
        <details><summary><span class="num">13</span>Подготовка к переезду<span class="plus"></span></summary><div class="body">Жильё, страховка, билеты и документы на первые дни.</div></details>
      </div>
    </div>

    <div class="outcome">
      <div>
        <h3 style="font-size:1.7rem">К концу курса у вас на руках будет</h3>
        <p class="small" style="margin-top:12px;font-size:1rem;color:var(--muted)">Это не просмотр видео, а рабочий план, который вы заполняете по ходу курса.</p>
      </div>
      <ul class="ticks">
        <li>выбранные страны и список из 3–5 вузов с категориями</li>
        <li>расчёт полного бюджета на год</li>
        <li>календарь дедлайнов по каждому вузу</li>
        <li>собранный пакет документов по шаблонам</li>
        <li>понимание, как подать заявку и что делать после ответа вуза</li>
      </ul>
    </div>
  </div>
</section>


<!-- BUDGET -->
<section class="sec" id="budget">
  <div class="wrap">
    <p class="label">Честный расчёт</p>
    <h2>Сколько это стоит на самом деле</h2>
    <p class="lead" style="margin-top:18px">Стоимость обучения с сайта университета — только часть суммы. Реальный бюджет на год складывается из обучения, жилья, питания, транспорта, медицинской страховки, визы, билетов и учебных материалов.</p>

    <div class="tablewrap">
      <table>
        <thead><tr><th>Страна</th><th>Обучение в год</th><th>Жизнь в месяц</th></tr></thead>
        <tbody>
          <tr><td>США</td><td>20–60 тыс. $</td><td>1 200–2 500 $</td></tr>
          <tr><td>Италия (государственные вузы)</td><td>500–4 000 €</td><td>700–1 000 €</td></tr>
          <tr><td>Китай</td><td>2,5–7 тыс. $</td><td>300–600 $</td></tr>
        </tbody>
      </table>
    </div>
    <p class="small">Ориентировочные цифры. Точные суммы и дедлайны всегда проверяйте на официальном сайте программы.</p>
  </div>
</section>

<!-- HONESTY -->
<section class="sec">
  <div class="wrap">
    <p class="label">Без пустых обещаний</p>
    <h2>Мы не обещаем поступление. <em>Обещаем ясность</em></h2>
    <div class="duo">
      <div class="a">
        <h3>Что иногда скрывается за «гарантией поступления»</h3>
        <p>Компания подаёт документы в выбранный вами вуз и параллельно в другой, с которым у неё есть договорённость. Поступить можно, но не туда, куда вы хотели.</p>
      </div>
      <div class="b">
        <h3>Как работаем мы</h3>
        <p>Вы сами выбираете страну и университет, понимаете каждый шаг и принимаете решение. Мы даём систему, шаблоны и живого консультанта, когда нужна помощь.</p>
      </div>
    </div>
  </div>
</section>

<!-- AUTHOR (filled from CONFIG.author) -->
<section class="sec" id="author-sec" hidden>
  <div class="wrap">
    <p class="label">Кто стоит за курсом</p>
    <h2 id="author-title"></h2>
    <div class="author">
      <div id="author-avatar"></div>
      <div><p class="lead" id="author-bio"></p><p class="small" id="author-role"></p></div>
    </div>
  </div>
</section>

<!-- COMPARE -->
<section class="sec">
  <div class="wrap">
    <p class="label">Что подойдёт именно вам</p>
    <h2>Telegram, курс или сопровождение</h2>
    <div class="tablewrap compare">
      <table>
        <thead><tr><th></th><th>Telegram и YouTube</th><th class="us">Курс «Дорожная карта»</th><th>Полное сопровождение</th></tr></thead>
        <tbody>
          <tr><td>Структура</td><td>Разрозненно, мнения спорят</td><td class="us">Отфильтрованная система из 13 модулей</td><td>Индивидуальный план</td></tr>
          <tr><td>Кто делает работу</td><td>Вы сами</td><td class="us">Вы сами, по чёткому плану</td><td>Консультант вместе с вами</td></tr>
          <tr><td>Цена</td><td>Бесплатно</td><td class="us">$99</td><td>€599</td></tr>
          <tr><td>Кому подходит</td><td>Изучить тему</td><td class="us">Готовым делать самим</td><td>Тем, кто хочет, чтобы всё делали вместе</td></tr>
        </tbody>
      </table>
    </div>
    <p class="more">Начните с курса. Если понадобится помощь, всегда можно перейти на сопровождение.</p>
  </div>
</section>

<!-- PRICING -->
<section class="sec" id="pricing">
  <div class="wrap">
    <p class="label">Цены</p>
    <h2>Два формата, без скрытых платежей</h2>

    <div class="plans">
      <article class="plan main">
        <p class="tag">Начните отсюда</p>
        <h3>Дорожная карта</h3>
        <div class="price">$99</div>
        <p class="per">Один платёж <span id="som"></span></p>
        <ul>
          <li>13 модулей: от выбора страны до переезда</li>
          <li>Шаблоны документов</li>
          <li>Чат поддержки в Telegram</li>
          <li>Модули 1–2 сразу, остальные по дням</li>
          <li>Бесплатный созвон 15 минут, если курс не подошёл</li>
        </ul>
        <button class="btn" data-cta="course" type="button">Получить курс</button>
      </article>

      <article class="plan">
        <p class="tag">Если нужна помощь рядом</p>
        <h3>Полное сопровождение</h3>
        <div class="price">€599</div>
        <p class="per">Разбор вашей ситуации до оплаты</p>
        <ul>
          <li>Личный консультант на каждом этапе</li>
          <li>Помощь от выбора вуза до подачи документов и визы</li>
          <li>Разбор нестандартных случаев</li>
          <li>Ответы по делу, без «погуглите сами»</li>
        </ul>
        <button class="btn btn-ghost" data-cta="support" type="button">Записаться на разбор</button>
      </article>
    </div>
    <p class="small">Способы оплаты подскажем в мессенджере после заявки.</p>

    <div class="guarantee">
      <h3>Курс не подошёл? Разберёмся вместе</h3>
      <p>Мы не возвращаем деньги «на всякий случай» и не обещаем поступление, потому что честно этого не может никто. Но если после первых модулей вы понимаете, что курс вам не подходит, у вас остались вопросы или ситуация нестандартная, мы проведём бесплатный созвон на 15 минут, разберём ваш случай и подскажем следующий шаг.</p>
    </div>
  </div>
</section>

<!-- REVIEWS (filled from CONFIG.testimonials) -->
<section class="sec" id="reviews-sec" hidden>
  <div class="wrap">
    <p class="label">Отзывы</p>
    <h2>Что говорят студенты</h2>
    <div class="quotes" id="quotes"></div>
  </div>
</section>

<!-- FAQ -->
<section class="sec" id="faq">
  <div class="wrap">
    <p class="label">Вопросы</p>
    <h2>Частые вопросы</h2>
    <div class="faq">
      <details><summary>Чем курс отличается от бесплатной информации в Telegram?<span class="plus"></span></summary><div class="body">В Telegram много, но противоречиво и без системы. В курсе информация отфильтрована и выстроена по шагам, от выбора страны до визы, без дублей и противоречий.</div></details>
      <details><summary>Это видео, а не живой консультант. Как оно поможет?<span class="plus"></span></summary><div class="body">Курс построен на системе, по которой мы сами работаем с клиентами. К нему прилагается чат поддержки, а если нужен живой человек, есть бесплатный созвон на 15 минут и сопровождение.</div></details>
      <details><summary>У меня нестандартный случай. Курс подойдёт?<span class="plus"></span></summary><div class="body">Общая база нужна почти всем: документы, подача, виза. После курса можно записаться на бесплатный созвон, и мы вместе разберёмся, как поступать именно в вашей ситуации.</div></details>
      <details><summary>А если это разводилово?<span class="plus"></span></summary><div class="body">Мы называем автора курса, показываем реальные материалы и не обещаем «100% поступление». Если курс не подошёл, мы проводим бесплатный созвон и объясняем, что делать дальше. Перед покупкой можно сначала написать нам и задать любые вопросы.</div></details>
      <details><summary>Подходит ли курс для любой страны?<span class="plus"></span></summary><div class="body">Курс универсальный: большая часть шагов одинакова для всех стран. Отличия по требованиям и подаче разобраны на примерах США, Италии и Китая. Если вам нужна другая страна, база остаётся той же, а детали уточним на созвоне.</div></details>
      <details><summary>Сколько времени занимает курс?<span class="plus"></span></summary><div class="body">Модули 4–13 открываются постепенно, поэтому пройти всё за один вечер нельзя. Дальше темп зависит от вас: вы заполняете свой план по ходу курса.</div></details>
      <details><summary>Нужен ли IELTS до покупки курса?<span class="plus"></span></summary><div class="body">Нет. В курсе вы узнаете, какой экзамен нужен под вашу программу, какой балл и когда записываться. Обычно регистрироваться советуем за 2–3 месяца до дедлайна подачи документов.</div></details>
      <details><summary>Как оплатить?<span class="plus"></span></summary><div class="body">Нажмите «Получить курс» и напишите нам в WhatsApp или Telegram. Подскажем удобный способ оплаты и откроем доступ.</div></details>
      <details><summary>Для кого курс: школьника, родителя или магистратуры?<span class="plus"></span></summary><div class="body">Для всех, кто поступает за границу: для школьников и их родителей, а также для тех, кто планирует магистратуру или MBA. Выберите в начале страницы, кто вы, и мы покажем подходящий вход.</div></details>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="sec cta">
  <div class="wrap">
    <h2 style="max-width:18ch">Начните с плана, <em>а не с хаоса</em></h2>
    <p class="lead" style="margin-top:18px">Получите курс сразу или сначала обсудите свою ситуацию. Если понадобится помощь, мы рядом.</p>
    <div class="actions">
      <button class="btn" data-cta="course" type="button">Получить курс за $99</button>
      <button class="btn btn-ghost" data-cta="consult" type="button">Бесплатная консультация</button>
    </div>
  </div>
</section>

</main>

<footer>
  <div class="wrap">
    <span>© 2026 BAT Consulting · Бишкек, Кыргызстан</span>
    <nav id="foot-links" aria-label="Ссылки"></nav>
  </div>
</footer>

<dialog id="contact" aria-labelledby="dlg-title">
  <div class="dlg">
    <button class="close" type="button" aria-label="Закрыть" id="dlg-close">×</button>
    <h3 id="dlg-title"></h3>
    <p class="lead">Выберите, где удобнее. Сообщение уже подготовлено, останется его отправить.</p>
    <div class="msg" id="dlg-msg"></div>
    <div class="row" id="dlg-row"></div>
    <button class="copy" type="button" id="dlg-copy">Скопировать сообщение</button>
  </div>
</dialog>
`;

export default function HomePage() {
  useEffect(() => {

  var body = document.body;
  var role = "student";
  var roleWord = { student: "школьник", parent: "родитель" };

  /* переключатель школьник / родитель */
  document.querySelectorAll("[data-set-role]").forEach(function(btn){
    btn.addEventListener("click", function(){
      role = btn.getAttribute("data-set-role");
      body.setAttribute("data-role", role);
      document.querySelectorAll("[data-set-role]").forEach(function(b){
        b.setAttribute("aria-pressed", String(b === btn));
      });
    });
  });

  /* окно выбора мессенджера */
  var dlg = document.getElementById("contact");
  var intents = {
    course:  { title: "Получить курс «Дорожная карта»", msg: function(r){ return "Здравствуйте! Хочу получить курс «Дорожная карта» ($99). Я " + r + "."; } },
    consult: { title: "Бесплатная консультация", msg: function(r){ return "Здравствуйте! Хочу бесплатную консультацию на 15 минут. Я " + r + "."; } },
    support: { title: "Разбор сопровождения", msg: function(r){ return "Здравствуйте! Хочу узнать про полное сопровождение поступления. Я " + r + "."; } }
  };
  var currentText = "";

  function openDialog(kind){
    var it = intents[kind] || intents.consult;
    currentText = it.msg(roleWord[role]);
    document.getElementById("dlg-title").textContent = it.title;
    document.getElementById("dlg-msg").textContent = currentText;
    var row = document.getElementById("dlg-row");
    row.textContent = "";
    var enc = encodeURIComponent(currentText);
    if (CONFIG.whatsapp) {
      var wa = document.createElement("a");
      wa.className = "btn"; wa.target = "_blank"; wa.rel = "noopener";
      wa.href = "https://wa.me/" + CONFIG.whatsapp.replace(/\D/g, "") + "?text=" + enc;
      wa.textContent = "Написать в WhatsApp";
      row.appendChild(wa);
    }
    if (CONFIG.telegram) {
      var tg = document.createElement("a");
      tg.className = "btn btn-ghost"; tg.target = "_blank"; tg.rel = "noopener";
      tg.href = "https://t.me/" + CONFIG.telegram.replace(/^@/, "");
      tg.textContent = "Написать в Telegram";
      row.appendChild(tg);
    }
    if (!CONFIG.whatsapp && !CONFIG.telegram) {
      var p = document.createElement("p");
      p.className = "small";
      p.textContent = "Скопируйте сообщение и отправьте его нам в любом мессенджере.";
      row.appendChild(p);
    }
    document.getElementById("dlg-copy").textContent = "Скопировать сообщение";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  document.querySelectorAll("[data-cta]").forEach(function(btn){
    btn.addEventListener("click", function(){ openDialog(btn.getAttribute("data-cta")); });
  });
  document.getElementById("dlg-close").addEventListener("click", function(){ dlg.close(); });
  dlg.addEventListener("click", function(e){ if (e.target === dlg) dlg.close(); });
  document.getElementById("dlg-copy").addEventListener("click", function(){
    var b = this;
    function done(){ b.textContent = "Скопировано"; }
    try {
      navigator.clipboard.writeText(currentText).then(done, function(){});
    } catch (e) {
      var ta = document.createElement("textarea");
      ta.value = currentText; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e2) {}
      document.body.removeChild(ta);
    }
  });

  /* цена в сомах */
  if (CONFIG.priceSomNote) document.getElementById("som").textContent = "· " + CONFIG.priceSomNote;

  /* автор */
  var a = CONFIG.author;
  if (a && a.name) {
    document.getElementById("author-sec").hidden = false;
    document.getElementById("author-title").textContent = a.name;
    document.getElementById("author-bio").textContent = a.bio || "";
    document.getElementById("author-role").textContent = a.role || "";
    var holder = document.getElementById("author-avatar");
    if (a.photo) {
      var img = document.createElement("img");
      img.className = "avatar"; img.src = a.photo; img.alt = a.name;
      holder.appendChild(img);
    } else {
      var av = document.createElement("div");
      av.className = "avatar"; av.textContent = a.name.trim().charAt(0).toUpperCase();
      holder.appendChild(av);
    }
  }

  /* отзывы */
  if (CONFIG.testimonials && CONFIG.testimonials.length) {
    document.getElementById("reviews-sec").hidden = false;
    var box = document.getElementById("quotes");
    CONFIG.testimonials.forEach(function(t){
      var q = document.createElement("div"); q.className = "quote";
      var p = document.createElement("p"); p.textContent = t.text;
      var s = document.createElement("small"); s.textContent = t.name + (t.note ? " · " + t.note : "");
      q.appendChild(p); q.appendChild(s); box.appendChild(q);
    });
  }

  /* ссылки в подвале */
  var foot = document.getElementById("foot-links");
  function addLink(label, url){
    if (!url) return;
    var l = document.createElement("a"); l.href = url; l.textContent = label;
    l.target = "_blank"; l.rel = "noopener"; foot.appendChild(l);
  }
  addLink("Instagram", CONFIG.instagram);
  addLink("Оферта", CONFIG.offerUrl);
  addLink("Политика конфиденциальности", CONFIG.privacyUrl);

  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,600;0,8..60,700;0,8..60,800;1,8..60,600&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: PAGE_HTML }} />
    </>
  );
}
