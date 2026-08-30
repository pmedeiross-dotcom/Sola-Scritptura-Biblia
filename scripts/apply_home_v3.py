import re
from pathlib import Path

app = Path('src/App.tsx')
text = app.read_text(encoding='utf-8')

import_line = "import HomeScreenV3 from './components/HomeScreenV3';\n"
if import_line not in text:
    marker = "import OnboardingModal from './components/OnboardingModal';\n"
    if marker in text:
        text = text.replace(marker, marker + import_line, 1)
    else:
        text = import_line + text

start = text.find('const HomeScreen = ({')
end = text.find('\nconst ReadingPlansScreen = (', start)
if start < 0 or end < 0:
    raise SystemExit('HomeScreen boundaries not found')

wrapper = '''const HomeScreen = ({
  onNavigate,
  onOpenPlan,
}: {
  onNavigate: (s: Screen) => void;
  onOpenPlan: (plan: ReadingPlan) => void;
}) => (
  <HomeScreenV3 onNavigate={onNavigate} onOpenPlan={onOpenPlan} />
);
'''
text = text[:start] + wrapper + text[end:]
app.write_text(text, encoding='utf-8')

css = Path('src/index.css')
css_text = css.read_text(encoding='utf-8')
marker = '/* SOLA SCRIPTURA HOME V3 */'
if marker not in css_text:
    css_text += r'''

/* SOLA SCRIPTURA HOME V3 */
.ss-v3-home{height:100%;min-height:0;overflow-y:auto;background:#f4f6fb;color:#17212b}
.dark .ss-v3-home{background:#0b1117;color:#eef2f5}
.ss-v3-inner{width:100%;max-width:1220px;margin:0 auto;padding:28px 28px 52px}
.ss-v3-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}
.ss-v3-eyebrow{display:block;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#0f766e}
.ss-v3-header h1{margin:7px 0 5px;font:900 clamp(1.8rem,3.5vw,2.65rem)/1.05 Georgia,serif;letter-spacing:-.04em;color:#111827}
.dark .ss-v3-header h1{color:#f8fafc}
.ss-v3-header p{margin:0;color:#718096;font-size:.9rem}
.ss-v3-settings{width:44px;height:44px;display:grid;place-items:center;border:1px solid #e2e8f0;border-radius:14px;background:#fff;color:#64748b;box-shadow:0 8px 24px rgba(15,23,42,.06);transition:.2s}
.ss-v3-settings:hover{transform:translateY(-2px);color:#4f46e5}.dark .ss-v3-settings{background:#17212b;border-color:#2a3642;color:#cbd5e1}
.ss-v3-hero{position:relative;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;min-height:235px;padding:30px 32px;overflow:hidden;border-radius:30px;color:#fff;background:linear-gradient(135deg,#4f46e5 0%,#3730a3 100%);box-shadow:0 24px 55px rgba(67,56,202,.23)}
.ss-v3-hero:before{content:'';position:absolute;width:330px;height:330px;right:-100px;top:-180px;border-radius:50%;background:rgba(255,255,255,.12)}
.ss-v3-hero-copy{position:relative;z-index:1;max-width:900px}.ss-v3-hero-copy>span{font-size:10px;font-weight:900;letter-spacing:.2em;color:rgba(255,255,255,.68)}
.ss-v3-hero-copy p{margin:19px 0 16px;font:italic 500 clamp(1.45rem,3vw,2.25rem)/1.3 Georgia,serif}.ss-v3-hero-copy strong{font-size:1rem}
.ss-v3-hero-actions{position:relative;z-index:1;display:flex;align-items:center;gap:9px}.ss-v3-share{width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.14)}
.ss-v3-read{height:46px;display:flex;align-items:center;gap:5px;padding:0 15px;border-radius:14px;background:#fff;color:#3730a3;font-size:.76rem;font-weight:900;box-shadow:0 10px 25px rgba(0,0,0,.12)}
.ss-v3-section{margin-top:30px}.ss-v3-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:13px;padding:0 2px}.ss-v3-section-head h2{margin:4px 0 0;font-size:1.18rem;font-weight:900;letter-spacing:-.02em;color:#111827}.dark .ss-v3-section-head h2{color:#f8fafc}
.ss-v3-count,.ss-v3-see-all{font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#4f46e5}
.ss-v3-primary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.ss-v3-primary{min-height:145px;position:relative;padding:18px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:12px;text-align:left;border:1px solid #e5eaf0;border-radius:23px;background:#fff;box-shadow:0 9px 28px rgba(15,23,42,.055);transition:transform .2s,box-shadow .2s}.ss-v3-primary:hover{transform:translateY(-3px);box-shadow:0 16px 35px rgba(15,23,42,.1)}.dark .ss-v3-primary{background:#17212b;border-color:#273441}
.ss-v3-primary-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:14px}.ss-v3-primary strong,.ss-v3-primary small{display:block}.ss-v3-primary strong{font-size:.98rem;font-weight:900;color:#111827}.dark .ss-v3-primary strong{color:#f8fafc}.ss-v3-primary small{margin-top:4px;color:#718096;font-size:.7rem;line-height:1.35}.ss-v3-arrow{position:absolute;right:17px;bottom:18px;color:#a0aec0}
.ss-v3-gold .ss-v3-primary-icon{background:#fef3c7;color:#b45309}.ss-v3-green .ss-v3-primary-icon{background:#d1fae5;color:#059669}.ss-v3-blue .ss-v3-primary-icon{background:#dbeafe;color:#2563eb}.ss-v3-violet .ss-v3-primary-icon{background:#ede9fe;color:#7c3aed}
.ss-v3-resource-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:9px}.ss-v3-resource{min-height:91px;padding:10px 7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:1px solid #e5eaf0;border-radius:18px;background:rgba(255,255,255,.84);color:#64748b;transition:.18s}.ss-v3-resource:hover{transform:translateY(-2px);color:#4f46e5;border-color:#d9dcff}.dark .ss-v3-resource{background:#151e27;border-color:#273441;color:#cbd5e1}.ss-v3-resource span{color:#5b5ce2}.ss-v3-resource strong{font-size:.67rem;text-align:center;line-height:1.15}
.ss-v3-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.ss-v3-plan{padding:19px;border:1px solid #e5eaf0;border-radius:23px;background:#fff;box-shadow:0 9px 28px rgba(15,23,42,.045)}.dark .ss-v3-plan{background:#17212b;border-color:#273441}.ss-v3-plan-top{display:flex;align-items:center;justify-content:space-between;color:#8a97a5;font-size:.68rem;font-weight:800}.ss-v3-plan-top span{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#eef2ff;color:#4f46e5}.ss-v3-plan h3{margin:14px 0 5px;font-size:.98rem;font-weight:900;color:#111827}.dark .ss-v3-plan h3{color:#f8fafc}.ss-v3-plan p{margin:0 0 13px;color:#4f46e5;font-size:.7rem;font-weight:700}.ss-v3-progress{height:7px;overflow:hidden;border-radius:99px;background:#edf0f4}.ss-v3-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#4f46e5,#6366f1)}.ss-v3-plan-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:10px}.ss-v3-plan-bottom small{font-size:.65rem;font-weight:800;text-transform:uppercase;color:#94a3b8}.ss-v3-plan-bottom button{font-size:.72rem;font-weight:900;color:#4f46e5}
.ss-v3-resume{margin-top:28px;display:flex;align-items:center;gap:15px;padding:18px 20px;border-radius:23px;border:1px solid #dce4ea;background:linear-gradient(135deg,#fff,#f8fafc);box-shadow:0 10px 28px rgba(15,23,42,.05)}.dark .ss-v3-resume{background:#17212b;border-color:#273441}.ss-v3-resume-icon{width:48px;height:48px;display:grid;place-items:center;flex:none;border-radius:15px;background:#e0f2fe;color:#0369a1}.ss-v3-resume h2{margin:3px 0;font-size:.95rem;font-weight:900}.ss-v3-resume p{margin:0;color:#718096;font-size:.7rem}.ss-v3-resume>button{margin-left:auto;display:flex;align-items:center;gap:5px;white-space:nowrap;padding:11px 14px;border-radius:13px;background:#0f766e;color:#fff;font-size:.72rem;font-weight:900}
@media(max-width:1050px){.ss-v3-primary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ss-v3-resource-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.ss-v3-plans{grid-template-columns:1fr}}
@media(max-width:680px){.ss-v3-inner{padding:18px 14px 36px}.ss-v3-header h1{font-size:1.7rem}.ss-v3-header p{font-size:.78rem}.ss-v3-hero{display:block;min-height:0;padding:24px;border-radius:24px}.ss-v3-hero-copy p{font-size:1.38rem;margin-top:16px}.ss-v3-hero-actions{margin-top:20px}.ss-v3-primary-grid{grid-template-columns:1fr 1fr;gap:9px}.ss-v3-primary{min-height:145px;padding:15px}.ss-v3-resource-grid{grid-template-columns:repeat(4,1fr);gap:7px}.ss-v3-resource{min-height:75px;border-radius:15px}.ss-v3-resource strong{font-size:.58rem}.ss-v3-resume{align-items:flex-start;flex-wrap:wrap}.ss-v3-resume>button{margin-left:63px}}
@media(max-width:430px){.ss-v3-primary-grid{grid-template-columns:1fr}.ss-v3-resource-grid{grid-template-columns:repeat(2,1fr)}}
'''
    css.write_text(css_text, encoding='utf-8')
