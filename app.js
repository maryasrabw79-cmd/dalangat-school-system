(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const cfg = window.SCHOOL_DB_CONFIG || {};
  const state = { client:null, user:null, profile:null, role:'viewer', section:'employees', cache:{employees:[],students:[]}, rows:[] };
  const sections = {
    employees:{title:'العاملون',table:'employees',desc:'سجل بيانات العاملين بالمدرسة.',fields:[['full_name','الاسم الكامل','text',true],['national_id','الرقم القومي','text'],['job_title','المسمى الوظيفي','text'],['specialty','التخصص','text'],['qualification','المؤهل','text'],['phone','الهاتف','tel'],['address','العنوان','text'],['hire_date','تاريخ التعيين','date']],columns:[['full_name','الاسم'],['national_id','الرقم القومي'],['job_title','الوظيفة'],['specialty','التخصص'],['phone','الهاتف'],['hire_date','تاريخ التعيين']]},
    students:{title:'الطالبات',table:'students',desc:'سجل بيانات الطالبات وقيدهن.',fields:[['full_name','اسم الطالبة','text',true],['student_number','رقم الطالبة','text'],['grade','الصف الدراسي','select',true,['الأول','الثاني','الثالث']],['section','الفصل','text'],['specialty','التخصص','text'],['phone','هاتف الطالبة','tel'],['guardian_phone','هاتف ولي الأمر','tel'],['status','حالة القيد','select',false,['مقيدة','منقطعة','محولة','متخرجة']],['notes','ملاحظات','textarea']],columns:[['full_name','اسم الطالبة'],['student_number','رقم الطالبة'],['grade','الصف'],['section','الفصل'],['specialty','التخصص'],['status','الحالة']]},
    attendance:{title:'الحضور والغياب',table:'attendance',desc:'تسجيل حضور الطالبات أو غيابهن.',fields:[['student_id','الطالبة','select',true,'students'],['attendance_date','التاريخ','date',true],['status','الحالة','select',true,['حضور','غياب','تأخير','إذن']],['notes','ملاحظات','textarea']],columns:[['student_name','الطالبة'],['attendance_date','التاريخ'],['status','الحالة'],['notes','ملاحظات']]},
    leaves:{title:'الإجازات',table:'leaves',desc:'تسجيل ومتابعة إجازات العاملين.',fields:[['employee_id','العامل','select',true,'employees'],['leave_type','نوع الإجازة','select',true,['اعتيادية','عارضة','مرضية','بدون مرتب','أخرى']],['start_date','من تاريخ','date',true],['end_date','إلى تاريخ','date',true],['status','حالة الطلب','select',true,['قيد المراجعة','مقبولة','مرفوضة']],['notes','ملاحظات','textarea']],columns:[['employee_name','العامل'],['leave_type','نوع الإجازة'],['start_date','من'],['end_date','إلى'],['status','الحالة'],['notes','ملاحظات']]},
    training_courses:{title:'التدريب',table:'training_courses',desc:'إدارة الدورات التدريبية ومتابعتها.',fields:[['title','اسم الدورة','text',true],['provider','الجهة المنظمة','text'],['start_date','تاريخ البداية','date'],['end_date','تاريخ النهاية','date'],['duration_days','المدة بالأيام','number'],['participants','المشاركون','text'],['notes','ملاحظات','textarea']],columns:[['title','الدورة'],['provider','الجهة المنظمة'],['start_date','البداية'],['end_date','النهاية'],['duration_days','المدة'],['participants','المشاركون']]},
    staff_schedules:{title:'الجداول',table:'staff_schedules',desc:'إدارة الجداول المدرسية والحصص.',fields:[['day_of_week','اليوم','select',true,['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس']],['period_no','رقم الحصة','number',true],['class_or_location','الفصل / المكان','text',true],['subject','المادة','text',true],['employee_id','المعلم/المعلمة','select',false,'employees'],['notes','ملاحظات','textarea']],columns:[['day_of_week','اليوم'],['period_no','الحصة'],['class_or_location','الفصل / المكان'],['subject','المادة'],['employee_name','المعلم/المعلمة'],['notes','ملاحظات']]}
  };
  const admin = () => ['admin','manager','principal'].includes(state.role);
  const say = (id,msg,type='') => { const el=$(id); if(el){el.textContent=msg;el.className='message '+type;} };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const humanRole = r => ({admin:'مدير النظام',manager:'إدارة المدرسة',principal:'مدير المدرسة',viewer:'عرض فقط',employee:'موظف'})[r] || r;
  async function init(){
    if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey || cfg.supabaseUrl.includes('YOUR-PROJECT')){
      $('#loginView').classList.remove('hidden'); say('#loginMsg','إعدادات Supabase غير مكتملة. راجع ملف config.js.','error'); return;
    }
    state.client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    $('#loginForm').addEventListener('submit',login); $('#logoutBtn').addEventListener('click',logout); $('#refreshBtn').addEventListener('click',()=>loadSection(state.section));
    state.client.auth.onAuthStateChange((_event,session)=>{ if(session?.user){ state.user=session.user; setTimeout(loadProfile,0); } else { state.user=null; state.profile=null; showLogin(); }});
    const {data:{session}}=await state.client.auth.getSession(); if(session?.user){state.user=session.user;await loadProfile();} else showLogin();
  }
  function showLogin(){ $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden'); $('#logoutBtn').classList.add('hidden'); }
  async function login(e){ e.preventDefault(); say('#loginMsg','جارٍ تسجيل الدخول...'); const {error}=await state.client.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value}); if(error) say('#loginMsg','تعذر الدخول: '+error.message,'error'); else say('#loginMsg','تم تسجيل الدخول.','success'); }
  async function logout(){await state.client.auth.signOut();}
  async function loadProfile(){
    const {data,error}=await state.client.from('profiles').select('*').eq('id',state.user.id).maybeSingle();
    if(error){ showLogin();say('#loginMsg','تعذر قراءة صلاحيات الحساب: '+error.message,'error');return; }
    if(!data){showLogin();say('#loginMsg','تم الدخول، لكن لا يوجد سجل لهذا الحساب في profiles. اطلب من مسؤول النظام ربط الحساب بملف وصلاحية.','error');return;}
    state.profile=data;state.role=String(data.role||'viewer').toLowerCase();
    $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');$('#welcomeTitle').textContent='أهلًا بك في منظومة المدرسة';$('#roleLabel').textContent='صلاحيتك: '+humanRole(state.role);
    renderTabs(); await loadStats(); await loadSection(state.section);
  }
  function allowedSections(){ if(admin()||state.role==='viewer')return Object.keys(sections); if(state.role==='employee')return ['employees','training_courses']; return ['employees']; }
  function renderTabs(){ const nav=$('#tabs');nav.innerHTML=''; const allowed=allowedSections(); if(!allowed.includes(state.section))state.section=allowed[0]; allowed.forEach(key=>{const b=document.createElement('button');b.className='tab'+(key===state.section?' active':'');b.textContent=sections[key].title;b.onclick=()=>{state.section=key;renderTabs();loadSection(key);};nav.appendChild(b);}); }
  async function loadStats(){const specs=[['employees','العاملون'],['students','الطالبات'],['attendance','سجلات الحضور']];let html='';for(const [t,label] of specs){const {count,error}=await state.client.from(t).select('id',{count:'exact',head:true});html+=`<div class="stat"><strong>${error?'—':(count??0)}</strong><span>${label}</span></div>`;}$('#stats').innerHTML=html;}
  async function getOptions(table){const {data}=await state.client.from(table).select('id,full_name').order('full_name').limit(1000);return data||[];}
  function fieldHTML(f){const [name,label,type='text',required=false,extra]=f;let control='';if(type==='select'){let opts=Array.isArray(extra)?extra.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''):'<option value="">جارٍ التحميل...</option>';control=`<select name="${name}" ${required?'required':''}>${name==='status'||name==='employment_status'||name==='grade'||name==='day_of_week'||name==='leave_type'?'<option value="">اختر...</option>':''}${opts}</select>`;}else if(type==='textarea'){control=`<textarea name="${name}" ${required?'required':''}></textarea>`;}else{control=`<input name="${name}" type="${type}" ${required?'required':''} ${type==='number'?'min="0"':''}>`;}return `<label>${esc(label)}${control}</label>`;}
  async function renderForm(sec){const host=$('#formHost');if(!admin()){host.innerHTML='<p>حسابك يملك صلاحية العرض فقط. لا يمكنك إضافة سجلات.</p>';return;}host.innerHTML=`<form id="recordForm" class="form-grid">${sec.fields.map(fieldHTML).join('')}<div class="form-actions"><button type="submit">حفظ السجل</button></div></form>`;
    for(const f of sec.fields){const [name,,type,,extra]=f;if(type==='select' && (extra==='employees'||extra==='students')){const list=await getOptions(extra);const select=$(`[name="${name}"]`);if(select)select.innerHTML='<option value="">اختر...</option>'+list.map(r=>`<option value="${esc(r.id)}">${esc(r.full_name)}</option>`).join('');}}
    $('#recordForm').addEventListener('submit',e=>saveRecord(e,sec));}
  async function loadSection(key){const sec=sections[key];if(!sec)return;$('#sectionTitle').textContent=sec.title;$('#sectionDesc').textContent=sec.desc;say('#sectionMsg','');await renderForm(sec);
    const selectCols={employees:'id,full_name,national_id,job_title,specialty,qualification,phone,address,hire_date,created_at',students:'*',attendance:'id,student_id,attendance_date,status,notes,created_at',leaves:'*',training_courses:'*',staff_schedules:'id,day_of_week,period_no,class_or_location,subject,employee_id,notes,created_at'};
    const {data,error}=await state.client.from(sec.table).select(selectCols[key]||'*').order('created_at',{ascending:false}).limit(500);
    if(error){say('#sectionMsg','تعذر تحميل البيانات: '+error.message,'error');$('#tableHead').innerHTML='';$('#tableBody').innerHTML='';return;}
    const rows=data||[];await enrichRows(key,rows);state.rows=rows;renderRows(sec,rows);
  }
  async function enrichRows(key,rows){const idKey=key==='leaves'?'employee_id':key==='staff_schedules'?'employee_id':'student_id';const ids=[...new Set(rows.map(r=>r[idKey]).filter(Boolean).map(String))];if(!ids.length)return;const table=(key==='attendance')?'students':'employees';const {data}=await state.client.from(table).select('id,full_name').in('id',ids);const names=new Map((data||[]).map(x=>[String(x.id),x.full_name]));rows.forEach(r=>{if(key==='attendance')r.student_name=r.student_name||names.get(String(r.student_id))||'—';else r.employee_name=r.employee_name||names.get(String(r.employee_id))||'—';});}
  function renderRows(sec,rows){const head=$('#tableHead'),body=$('#tableBody');head.innerHTML='<tr>'+sec.columns.map(c=>`<th>${esc(c[1])}</th>`).join('')+'</tr>';if(!rows.length){body.innerHTML=`<tr><td class="empty" colspan="${sec.columns.length}">لا توجد سجلات لعرضها.</td></tr>`;return;}body.innerHTML=rows.map(r=>'<tr>'+sec.columns.map(([key])=>`<td>${esc(r[key]??'—')}</td>`).join('')+'</tr>').join('');}
  async function saveRecord(e,sec){e.preventDefault();say('#sectionMsg','جارٍ الحفظ...');const form=new FormData(e.currentTarget);const data={};for(const f of sec.fields){const [name,,type]=f;const val=form.get(name);if(val!==null&&String(val).trim()!=='')data[name]=type==='number'?Number(val):String(val).trim();}
    if(sec.table==='attendance'){delete data.student_name;delete data.student_number;}
    if(sec.table==='leaves'||sec.table==='staff_schedules'){const {data:emp}=await state.client.from('employees').select('full_name').eq('id',data.employee_id).maybeSingle();if(emp)data.employee_name=emp.full_name;}
    const {error}=await state.client.from(sec.table).insert(data);if(error){say('#sectionMsg','لم يتم الحفظ: '+error.message,'error');return;}e.currentTarget.reset();say('#sectionMsg','تم حفظ السجل بنجاح.','success');await loadSection(state.section);await loadStats();}
  init().catch(e=>{console.error(e);showLogin();say('#loginMsg','حدث خطأ في تشغيل المنظومة: '+(e.message||e),'error');});
})();
