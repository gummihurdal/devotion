/* Grace for Every Day -- language layer (owner 2026-11-09 "start on grace").
   One small script, loaded by every page before its own code:
   - the language: ?lang=xx in the URL, else the saved choice, else the browser language, else English
   - the UI dictionary (data-i18n / data-i18n-ph attributes, GI.t('key') inside templates) and the date words
   - GI.overlay(): merges the translated row from devotionals_i18n / lessons_i18n / topics_i18n over the English
     row; anything missing stays English, so the site never breaks when a translation is absent. */
window.GI = (function () {
  const LANGS = { en: 'English', es: 'Español' };
  const STORE = 'grace_lang';
  function detect() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q && LANGS[q]) { localStorage.setItem(STORE, q); return q; }
      const s = localStorage.getItem(STORE);
      if (s && LANGS[s]) return s;
    } catch (e) { /* storage blocked: fall through */ }
    const b = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return LANGS[b] ? b : 'en';
  }
  const L = detect();

  const UI = {
    en: {
      logo_sub: 'Daily Scripture & Reflection', nav_devotion: 'Daily Devotion', nav_study: 'Study Topics',
      'topic_christian-identity': 'Identity', 'topic_the-cross': 'The Cross', topic_discipleship: 'Discipleship', topic_apologetics: 'Apologetics',
      topic_prayer: 'Prayer', topic_suffering: 'Suffering', 'topic_holy-spirit': 'Holy Spirit', 'topic_sin-and-grace': 'Sin & Grace',
      'topic_the-church': 'The Church', topic_eternity: 'Eternity', 'topic_the-sabbath': 'The Sabbath', 'topic_holiness-of-god': 'Holiness of God',
      nav_calendar: 'Calendar', nav_archive: 'Archive', nav_well: 'The Well', nav_blog: 'Blog', nav_contact: 'Contact', nav_settings: 'Settings',
      loading_word: "Preparing today's word", rest: 'Rest in His presence today', begin: 'Begin Reading', scripture_today: "Today's Scripture",
      theme: 'Theme', theme_note: "A meditation for today's journey.", sources: 'Sources', meditation: 'Meditation', call: "Today's Call",
      prayer: 'Closing Prayer', reflection: 'Reflection', deeper: 'Study Deeper', all_topics: 'All Twelve Topics',
      overview: 'Overview', lessons: 'Lessons', lesson: 'Lesson', of: 'of', key_idea: 'Key Idea', prev: '← Previous', next: 'Next →',
      topics_title: 'Study Topics', lessons_count: '84 Lessons', loading_topics: 'Loading topics',
      cal_title: 'Devotional Calendar', today: 'Today', prev_m: '← Prev', next_m: 'Next →',
      archive_title: 'Archive', devotionals: 'Devotionals', filter: 'Filter', all: 'All', search_ph: 'Search theme or scripture…', loading_devotionals: 'Loading devotionals…',
      m01: 'Jan', m02: 'Feb', m03: 'Mar', m04: 'Apr', m05: 'May', m06: 'Jun', m07: 'Jul', m08: 'Aug', m09: 'Sep', m10: 'Oct', m11: 'Nov', m12: 'Dec',
      hero_eyebrow: 'Pause · Reflect · Walk', hero_sub: 'A daily companion for the Christian life. Scripture, reflection, and prayer.',
      cta_devotional: 'Daily Devotional', cta_topics: 'Study Topics', cta_blog: 'Blog', scroll: 'Scroll Down',
      sec_eyebrow: 'Everything in One Place', sec_title: 'Where would you like to begin?',
      lbl_everyday: 'Every Day', card_devotion: 'Daily Devotion', desc_devotion: 'A fresh meditation each morning — scripture, reflection, a closing prayer, and a call to walk differently today.',
      lbl_topics: '12 Topics', card_topics: 'Study Topics', desc_topics: 'Deep-dive lessons on Identity, The Cross, Prayer, Suffering, Holiness and more. Structured to take you further.',
      lbl_year: 'Year View', card_calendar: 'Devotion Calendar', desc_calendar: 'See every devotion across the year. Navigate by month, revisit past days, or plan ahead in your walk.',
      lbl_archive: 'Full Archive', card_archive: 'Archive', desc_archive: 'Browse every devotion ever written. Filter by theme, scripture, or season. Nothing lost, everything available.',
      lbl_community: 'Community', card_blog: 'Blog', desc_blog: 'Share what God is speaking to you. Read what others are carrying. Walk together, even from a distance.',
      lbl_experience: 'Your Experience', card_settings: 'Settings', desc_settings: 'Personalise your name, reading preferences, and how the word is presented to you each day.',
      open_full: 'Open Full Devotional →', prev_p: '← Prev', next_p: 'Next →',
      blog_name: 'Please enter your name.', blog_more: 'Please write a little more.', blog_posting: 'Posting…', blog_fail: 'Could not post. Please try again.',
      blog_net: 'Network error. Please check your connection.', blog_post: 'Post Reflection →', blog_first: 'Be the first to share',
      blog_encourage: 'Your reflection could encourage someone today.', blog_load_fail: 'Could not load reflections.',
      listen: 'Listen', no_audio: 'Audio not yet available', no_links: 'No links yet.', no_sermons: 'No sermons yet', no_music: 'No music yet.', music_fail: 'Could not load music.',
      saved: 'Saved ✓', unsaved: 'You have unsaved changes', fs_small: 'Small', fs_medium: 'Medium', fs_large: 'Large', devotee: 'Morning Devotee',
      rt_morning: 'Morning · 5–7am', rt_midday: 'Midday · 12–1pm', rt_evening: 'Evening · 8–10pm', language: 'Language', change_lang: 'Change'
    },
    es: {
      logo_sub: 'Escritura y reflexión diarias', nav_devotion: 'Devoción diaria', nav_study: 'Temas de estudio',
      'topic_christian-identity': 'Identidad', 'topic_the-cross': 'La cruz', topic_discipleship: 'Discipulado', topic_apologetics: 'Apologética',
      topic_prayer: 'Oración', topic_suffering: 'Sufrimiento', 'topic_holy-spirit': 'Espíritu Santo', 'topic_sin-and-grace': 'Pecado y gracia',
      'topic_the-church': 'La iglesia', topic_eternity: 'Eternidad', 'topic_the-sabbath': 'El sábado', 'topic_holiness-of-god': 'Santidad de Dios',
      nav_calendar: 'Calendario', nav_archive: 'Archivo', nav_well: 'El pozo', nav_blog: 'Blog', nav_contact: 'Contacto', nav_settings: 'Ajustes',
      loading_word: 'Preparando la palabra de hoy', rest: 'Descanse hoy en su presencia', begin: 'Empezar a leer', scripture_today: 'La Escritura de hoy',
      theme: 'Tema', theme_note: 'Una meditación para el camino de hoy.', sources: 'Fuentes', meditation: 'Meditación', call: 'El llamado de hoy',
      prayer: 'Oración final', reflection: 'Reflexión', deeper: 'Profundizar', all_topics: 'Los doce temas',
      overview: 'Resumen', lessons: 'lecciones', lesson: 'Lección', of: 'de', key_idea: 'Idea clave', prev: '← Anterior', next: 'Siguiente →',
      topics_title: 'Temas de estudio', lessons_count: '84 lecciones', loading_topics: 'Cargando temas',
      cal_title: 'Calendario devocional', today: 'Hoy', prev_m: '← Ant.', next_m: 'Sig. →',
      archive_title: 'Archivo', devotionals: 'devocionales', filter: 'Filtrar', all: 'Todos', search_ph: 'Buscar tema o pasaje…', loading_devotionals: 'Cargando devocionales…',
      m01: 'Ene', m02: 'Feb', m03: 'Mar', m04: 'Abr', m05: 'May', m06: 'Jun', m07: 'Jul', m08: 'Ago', m09: 'Sep', m10: 'Oct', m11: 'Nov', m12: 'Dic',
      hero_eyebrow: 'Pausa · Reflexión · Camino', hero_sub: 'Un compañero diario para la vida cristiana. Escritura, reflexión y oración.',
      cta_devotional: 'Devocional diario', cta_topics: 'Temas de estudio', cta_blog: 'Blog', scroll: 'Desplácese',
      sec_eyebrow: 'Todo en un solo lugar', sec_title: '¿Por dónde quiere empezar?',
      lbl_everyday: 'Cada día', card_devotion: 'Devoción diaria', desc_devotion: 'Una meditación nueva cada mañana: Escritura, reflexión, una oración final y un llamado a caminar distinto hoy.',
      lbl_topics: '12 temas', card_topics: 'Temas de estudio', desc_topics: 'Lecciones a fondo sobre la identidad, la cruz, la oración, el sufrimiento, la santidad y más. Estructuradas para llevarle más lejos.',
      lbl_year: 'Vista anual', card_calendar: 'Calendario de devociones', desc_calendar: 'Vea cada devoción a lo largo del año. Navegue por mes, vuelva a días pasados o planifique su camino.',
      lbl_archive: 'Archivo completo', card_archive: 'Archivo', desc_archive: 'Explore cada devoción escrita. Filtre por tema, pasaje o temporada. Nada se pierde, todo está disponible.',
      lbl_community: 'Comunidad', card_blog: 'Blog', desc_blog: 'Comparta lo que Dios le está diciendo. Lea lo que otros llevan. Caminen juntos, aun a la distancia.',
      lbl_experience: 'Su experiencia', card_settings: 'Ajustes', desc_settings: 'Personalice su nombre, sus preferencias de lectura y cómo se le presenta la palabra cada día.',
      open_full: 'Abrir la devoción completa →', prev_p: '← Ant.', next_p: 'Sig. →',
      blog_name: 'Escriba su nombre, por favor.', blog_more: 'Escriba un poco más, por favor.', blog_posting: 'Publicando…', blog_fail: 'No se pudo publicar. Inténtelo de nuevo.',
      blog_net: 'Error de red. Revise su conexión.', blog_post: 'Publicar reflexión →', blog_first: 'Sea el primero en compartir',
      blog_encourage: 'Su reflexión podría animar a alguien hoy.', blog_load_fail: 'No se pudieron cargar las reflexiones.',
      listen: 'Escuchar', no_audio: 'Audio aún no disponible', no_links: 'Todavía no hay enlaces.', no_sermons: 'Todavía no hay sermones', no_music: 'Todavía no hay música.', music_fail: 'No se pudo cargar la música.',
      saved: 'Guardado ✓', unsaved: 'Tiene cambios sin guardar', fs_small: 'Pequeña', fs_medium: 'Mediana', fs_large: 'Grande', devotee: 'Lector matutino',
      rt_morning: 'Mañana · 5–7 h', rt_midday: 'Mediodía · 12–13 h', rt_evening: 'Noche · 20–22 h', language: 'Idioma', change_lang: 'Cambiar'
    }
  };
  const DAYS = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                 es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] };
  const MONTHS = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                   es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] };
  const T = Object.assign({}, UI.en, UI[L] || {});
  const PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  function extend(dict) { const d = dict && dict[PAGE]; if (d) Object.assign(T, d.en || {}, d[L] || {}); }   // i18n-pages.js
  const t = (k) => (T[k] != null ? T[k] : k);

  function greeting(hour, en) {
    if (L === 'es') return hour < 6 ? 'Buenas noches' : hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
    return 'Good ' + en[hour];
  }
  function apply(root) {
    const r = root || document;
    r.querySelectorAll('[data-i18n]').forEach((el) => { const v = T[el.dataset.i18n]; if (v != null) el.textContent = v; });
    r.querySelectorAll('[data-i18n-ph]').forEach((el) => { const v = T[el.dataset.i18nPh]; if (v != null) el.placeholder = v; });
    r.querySelectorAll('[data-i18n-html]').forEach((el) => { const v = T[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
    if (L !== 'en' && T.title) document.title = T.title;
    document.documentElement.lang = L;
  }

  const FK = { devotionals: 'devotional_id', lessons: 'lesson_id', topics: 'topic_id' };
  const SKIP = new Set(['id', 'lang', 'model', 'created_at']);
  async function overlay(SB, KEY, table, rows) {
    if (L === 'en' || !Array.isArray(rows) || !rows.length) return rows;
    const fk = FK[table];
    const ids = rows.map((r) => r && r.id).filter((x) => x != null);
    if (!fk || !ids.length) return rows;
    try {
      const r = await fetch(`${SB}/rest/v1/${table}_i18n?lang=eq.${L}&${fk}=in.(${ids.join(',')})&select=*`,
        { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
      const tr = await r.json();
      if (!Array.isArray(tr)) return rows;
      const by = new Map(tr.map((x) => [x[fk], x]));
      return rows.map((row) => {
        const x = by.get(row.id);
        if (!x) return row;
        const o = Object.assign({}, row, { _lang: L });
        for (const k in x) { if (SKIP.has(k) || k === fk || x[k] == null) continue; o[k] = x[k]; }
        return o;
      });
    } catch (e) { return rows; }
  }

  function set(l) {
    if (!LANGS[l]) return;
    try { localStorage.setItem(STORE, l); } catch (e) { /* ignore */ }
    const u = new URL(location.href); u.searchParams.delete('lang'); location.href = u.toString();
  }
  function mount(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = Object.keys(LANGS).map((l) =>
      `<button type="button" class="gi-btn${l === L ? ' on' : ''}" onclick="GI.set('${l}')" title="${LANGS[l]}">${l.toUpperCase()}</button>`).join('');
  }
  function choice(id) {                                   // landing page: pick the language once; it is remembered on the device
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<span class="lc-lbl">Language · Idioma</span>' + Object.keys(LANGS).map((l) =>
      `<button type="button" class="${l === L ? 'on' : ''}" onclick="GI.set('${l}')">${LANGS[l]}</button>`).join('');
  }
  const css = document.createElement('style');
  css.textContent = '.gi-lang{display:flex;gap:6px;padding:10px 22px 4px}' +
    '.gi-btn{background:transparent;border:1px solid rgba(201,164,58,.35);color:rgba(237,224,192,.8);font-size:10px;letter-spacing:2px;padding:5px 9px;cursor:pointer;border-radius:3px;font-family:inherit}' +
    '.gi-btn.on{background:var(--gold,#c9a43a);border-color:var(--gold,#c9a43a);color:#0b1222}.gi-btn:hover{border-color:var(--gold,#c9a43a)}' +
    '.gi-lang.top{position:absolute;top:18px;right:22px;z-index:6;padding:0}@media(max-width:768px){.gi-lang.top{top:12px;right:12px}}';
  document.head.appendChild(css);

  return { lang: L, LANGS, t, apply, extend, overlay, set, mount, choice, greeting, PAGE, DAYS: DAYS[L] || DAYS.en, MONTHS: MONTHS[L] || MONTHS.en };
})();
