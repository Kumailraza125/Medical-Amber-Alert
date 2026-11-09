from pathlib import Path
import json,subprocess,shutil
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('HCregular','/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('HCbold','/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
from xml.sax.saxutils import escape
from pptx import Presentation
from pptx.util import Inches,Pt
from pptx.dml.color import RGBColor
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/submission';OUT.mkdir(exist_ok=True)
s=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {submission} from './dist/submission-data.js';console.log(JSON.stringify(submission));"],cwd=ROOT))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='HCbody',fontName='HCregular',fontSize=9,leading=12,textColor=colors.HexColor('#29453d'),spaceAfter=6))
styles.add(ParagraphStyle(name='HChead',fontName='HCbold',fontSize=10,leading=13,textColor=colors.HexColor('#0c7164'),spaceBefore=6,spaceAfter=3))
styles.add(ParagraphStyle(name='HCtitle',fontName='HCbold',fontSize=21,leading=25,textColor=colors.HexColor('#173e34'),spaceAfter=5))
def P(t,style='HCbody'):return Paragraph(escape(t),styles[style])
def footer(canvas,doc):
 canvas.setStrokeColor(colors.HexColor('#cbdacf'));canvas.line(38,33,574,33)
 canvas.setFont('HCregular',7);canvas.setFillColor(colors.HexColor('#627b71'));canvas.drawString(38,22,'Team 8 | Hospital Connect | Fictional demo | Interview outstanding');canvas.drawRightString(574,22,str(doc.page))
flow=[P('Hospital Connect','HCtitle'),P('Build Your Own · Option 3 · Team 8 · One-page problem summary')]
sections=[
 ('Who has the problem?',s['organization']+' '+s['user']),
 ('What happens today, and why does it matter?',s['problem']+' '+s['stakes']),
 ('One core workflow and four must-haves',s['workflow']+' Must-haves: synthetic intake and explained demo priority; open-facility resource matching; saved request/offer/accept/complete workflow; synthetic-data checks and exports.'),
 ('Reluctant user and design choice',s['reluctant']),
 ('Data care, assumptions and scope','All identities, health identifiers, inventories, capacity and crew statuses are fictional. Network requests omit identity and medical background. The public demo has no real staff authentication. Screening is illustrative rule logic, not trained AI or clinical triage. Distance is straight-line; 12-hour fatigue markers and review timers are assumptions. Duplicate flags require human review and never deny coordination. Payment approval is a no-charge demonstration. No real alerts, transfers or payments occur.'),
 ('Platform boundary','Piezas owns hosting and saved records. Our app owns validation, matching, minimisation and workflow explanations. Real use needs authorised staff access, verified capacity, privacy/security review, clinical governance and a payment provider.'),
 ('Evidence and next validation','No interview yet: confirmed by the team. The team believes rural BC has medical staff shortages. News links below are secondary context from its draft, not verified user evidence. Interview a dispatcher or operations supervisor about a recent difficult transfer; record their role, date, consent and actual observations. Do not claim measured savings or outcomes.'),
]
for h,t in sections:flow.extend([P(h,'HChead'),P(t)])
flow.extend([P('Team-provided secondary context','HChead'),P('CBC: BC ambulance / paramedic pressure (9.6985466). CTV Vancouver: fewer paramedics on shift as BC Ambulance millions over budget. Links are in the submission requirement mapping.'),P('Live demo: https://hospital-connect-2179.apps.piezas.ai/workspace.html')])
SimpleDocTemplate(str(OUT/'problem-summary.pdf'),title='Hospital Connect — One-page problem summary',author='Team 8',pagesize=(612,792),topMargin=34,bottomMargin=42,leftMargin=38,rightMargin=38).build(flow,onFirstPage=footer,onLaterPages=footer)
pitch=[P('Hospital Connect — three-minute pitch','HCtitle'),P('Target: about three minutes including the screen demonstration. Rehearse and shorten to your own speaking pace. Every patient example is fictional.')]
for part in s['pitch']:pitch.extend([P(part['time']+' · '+part['title'],'HChead'),P(part['text']),Spacer(1,5)])
pitch.extend([P('Judge demonstration checklist','HChead'),P('1. Create a fictional MRI case and explain its demo priority. 2. Close a matching facility and show it disappear from recommendations. 3. Send the de-identified resource request, switch to an open matching hospital, offer, accept and complete. 4. Show a duplicate-data review, downloadable dataset and no-charge payment history. 5. Open the interview gap and assumptions.')])
SimpleDocTemplate(str(OUT/'pitch-script.pdf'),title='Hospital Connect — Three-minute pitch',author='Team 8',pagesize=(612,792),topMargin=38,bottomMargin=42,leftMargin=42,rightMargin=42).build(pitch,onFirstPage=footer,onLaterPages=footer)
r=Presentation();r.slide_width=Inches(13.333);r.slide_height=Inches(7.5)
slides=[
 ('Hospital Connect','A fictional coordination demo for rural BC',['Team 8 · Build Your Own / Option 3','One workflow: find a resource, request help, confirm an offer','No real patient data, alerts, payments or clinical decisions']),
 ('The person and the problem','Working hypothesis — not yet validated by an interview',[s['user'],'Availability is scattered across calls and updates.','Stakes: coordination time, staff workload and confidence in information.','No measured savings or clinical outcomes are claimed.']),
 ('Watch one case move','Intake → explain → match → request → offer → accept → complete',['Generated patient profile; every rule has a visible reason.','Match the required resource within a radius; exclude closed facilities.','Network request uses a case reference, without patient identity.','Piezas saves the shared workflow and its history.']),
 ('Data with care','Fictional examples only; honest limits',['Five generated profiles; CSV, JSON and Excel exports.','Importer accepts only the exact generated fictional dataset.','Duplicate signals ask for human review and never block coordination.','Public demo: no claim of staff authentication or healthcare compliance.']),
 ('Readiness, payments and platform','Demonstrations of the surrounding workflow',['Fictional facility status and crew shift-hours marker.','No-charge worker-payment draft, approval and handoff history.','Piezas owns saved records and hosting; the app owns its validation and workflow.','No trained clinical AI, real capacity feed or connected payment gateway.']),
 ('What we still need to learn','Our next step is a real conversation',['Interview outstanding: no dispatcher or clinician has been interviewed.','Ask about the last difficult resource transfer and missing information.','Validate the reluctant user, workflow and minimum data needs.','Ask: introduce us to a regional operations supervisor or lead dispatcher.']),
]
for index,(title,subtitle,bullets) in enumerate(slides):
 slide=r.slides.add_slide(r.slide_layouts[6]);bg=slide.background.fill;bg.solid();bg.fore_color.rgb=RGBColor.from_string('F3F7F3')
 def text(x,y,w,h,value,size=22,bold=False,color='203D37'):
  tf=slide.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h)).text_frame;tf.word_wrap=True
  for i,line in enumerate(value.split('\n')):
   p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line;p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color);p.space_after=Pt(18)
  return tf
 text(.7,.45,12,.3,'TEAM 8  /  EXPERIENCE VENTURES HACKATHON',12,True,'0C7164')
 text(.7,1,12,1,title,36,True)
 text(.7,2.0,12,.65,subtitle,19,False,'627B71')
 text(.9,3,11.6,3.6,'\n'.join('• '+b for b in bullets),21)
 text(.7,7.02,12,.3,f'Hospital Connect · Shared fictional demo · Interview outstanding                                      {index+1} / {len(slides)}',10,False,'627B71')
 slide.notes_slide.notes_text_frame.text=s['pitch'][min(index,len(s['pitch'])-1)]['text']
r.save(OUT/'pitch-slides.pptx')
shutil.copy(ROOT/'docs/HACKATHON_REQUIREMENTS.md',OUT/'requirements.md')
print('Generated problem summary, pitch script, slides and requirement mapping.')
