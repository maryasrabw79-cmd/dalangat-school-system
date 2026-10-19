(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const cfg = window.SCHOOL_DB_CONFIG || {};
  const state = { client:null, user:null, profile:null, role:'viewer', section:'employees', cache:{employees:[],students:[]}, rows:[] };
  const sections = {
    employees:{title:'العاملون',table:'staff',desc:'سجل بيانات العاملين بالمدرسة.',fields:[['full_name','الاسم الكامل','text',true],['employee_no','الرقم الوظيفي','text'],['job_title','المسمى الوظيفي','text'],['specialization','التخصص','text'],['qualification','المؤهل','text'],['phone','الهاتف','tel'],['email','البريد الإلكتروني','email'],['hire_date','تاريخ التعيين','date'],['employment_status','حالة العمل','select',true,['على رأس العمل','إجازة','ندب','انتهاء خدمة']],['notes','ملاحظات','textarea']],columns:[['full_name','الاسم'],['employee_no','الرقم الوظيفي'],['job_title','الوظيفة'],['specialization','التخصص'],['phone','الهاتف'],['employment_status','حالة العمل']]},
    students:{title:'الطالبات',table:'students',desc:'سجل بيانات الطالبات وقيدهن.',fields:[['full_name','اسم الطالبة','text',true],['student_code','كود الطالبة','text',true],['grade','الصف الدراسي','select',true,['الأول','الثاني','الثالث']],['section','الفصل','text'],['specialization','التخصص','select',true,['فني تكنولوجيا الحاسبات','فني الأجهزة الإلكترونية','فني الملابس الجاهزة']],['enrollment_status','حالة القيد','select',true,['مقيدة','منقطعة','محولة','متخرجة']],['birth_date','تاريخ الميلاد','date'],['guardian_name','اسم ولي الأمر','text'],['guardian_phone','هاتف ولي الأمر','tel']],columns:[['full_name','اسم الطالبة'],['student_code','كود الطالبة'],['grade','الصف'],['section','الفصل'],['specialization','التخصص'],['enrollment_status','الحالة']]},
    attendance:{title:'الحضور والغياب',table:'attendance',desc:'تسجيل حضور الطالبات أو غيابهن.',fields:[['student_id','الطالبة','select',true,'students'],['attendance_date','التاريخ','date',true],['status','الحالة','select',true,['حضور','غياب','تأخير','إذن']],['notes','ملاحظات','textarea']],columns:[['student_name','الطالبة'],['attendance_date','التاريخ'],['status','الحالة'],['notes','ملاحظات']]},
    leaves:{title:'الإجازات',table:'staff_leaves',desc:'تسجيل ومتابعة إجازات العاملين.',fields:[['staff_id','العامل','select',true,'staff'],['leave_type','نوع الإجازة','select',true,['اعتيادية','عارضة','مرضية','بدون مرتب','أخرى']],['start_date','من تاريخ','date',true],['end_date','إلى تاريخ','date',true],['status','حالة الطلب','select',true,['قيد المراجعة','مقبولة','مرفوضة']],['notes','ملاحظات','textarea']],columns:[['staff_name','العامل'],['leave_type','نوع الإجازة'],['start_date','من'],['end_date','إلى'],['status','الحالة'],['notes','ملاحظات']]},
    training_courses:{title:'التدريب',table:'training_courses',desc:'إدارة الدورات التدريبية ومتابعتها.',fields:[['staff_id','العامل/المتدرب','select',true,'staff'],['course_name','اسم الدورة','text',true],['provider','الجهة المنظمة','text'],['start_date','تاريخ البداية','date'],['end_date','تاريخ النهاية','date'],['hours','عدد الساعات','number'],['certificate_no','رقم الشهادة','text'],['notes','ملاحظات','textarea']],columns:[['staff_name','العامل/المتدرب'],['course_name','الدورة'],['provider','الجهة المنظمة'],['start_date','البداية'],['end_date','النهاية'],['hours','الساعات']]},
    staff_schedules:{title:'الجداول',table:'staff_schedules',desc:'إدارة الجداول المدرسية والحصص.',fields:[['staff_id','المعلم/المعلمة','select',true,'staff'],['day_of_week','اليوم','select',true,['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس']],['period_no','رقم الحصة','number',true],['subject_or_task','المادة / المهمة','text',true],['class_or_location','الفصل / المكان','text'],['academic_year','العام الدراسي','text']],columns:[['staff_name','المعلم/المعلمة'],['day_of_week','اليوم'],['period_no','الحصة'],['subject_or_task','المادة / المهمة'],['class_or_location','الفصل / المكان'],['academic_year','العام الدراسي']]}
  };
  const admin = () => state.role === 'admin';
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
  async function login(e){
    e.preventDefault();
    const button=$('#loginForm button[type="submit"]');
    if(!state.client){say('#loginMsg','لم يتم الاتصال بخدمة تسجيل الدخول. حدّث الصفحة، وإذا استمرت المشكلة أرسل لي نص الرسالة.','error');return;}
    if(button){button.disabled=true;button.textContent='جارٍ التحقق...';}
    say('#loginMsg','جارٍ التحقق من بيانات الدخول...');
    try{
      const {data,error}=await state.client.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});
      if(error){say('#loginMsg','تعذر الدخول: '+error.message,'error');return;}
      if(data?.user){say('#loginMsg','تم التحقق من الحساب، جارٍ تحميل صلاحياته...','success');}
      else{say('#loginMsg','لم يتم تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.','error');}
    }catch(err){console.error('Login error:',err);say('#loginMsg','حدث خطأ أثناء محاولة الدخول: '+(err?.message||String(err)),'error');}
    finally{if(button){button.disabled=false;button.textContent='دخول';}}
  }
  async function logout(){await state.client.auth.signOut();}
  async function loadProfile(){
    const {data,error}=await state.client.from('profiles').select('*').eq('id',state.user.id).maybeSingle();
    if(error){ showLogin();say('#loginMsg','تعذر قراءة صلاحيات الحساب: '+error.message,'error');return; }
    if(!data){showLogin();say('#loginMsg','تم الدخول، لكن لا يوجد سجل لهذا الحساب في profiles. اطلب من مسؤول النظام ربط الحساب بملف وصلاحية.','error');return;}
    state.profile=data;state.role=String(data.role||'viewer').toLowerCase();
    $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');$('#welcomeTitle').textContent='أهلًا بك في منظومة المدرسة';$('#roleLabel').textContent='صلاحيتك: '+humanRole(state.role);
    renderTabs(); await loadStats(); await loadSection(state.section);
  }
  function allowedSections(){ if(admin())return [...Object.keys(sections),'users']; if(state.role==='employee')return ['students','attendance']; return []; }
  function renderTabs(){ const nav=$('#tabs');nav.innerHTML=''; const allowed=allowedSections(); if(!allowed.length){nav.innerHTML='<span>لا توجد أقسام متاحة لهذا الحساب.</span>';return;} if(!allowed.includes(state.section))state.section=allowed[0]; allowed.forEach(key=>{const b=document.createElement('button');b.className='tab'+(key===state.section?' active':'');b.textContent=key==='users'?'إدارة المستخدمين':sections[key].title;b.onclick=()=>{state.section=key;renderTabs();loadSection(key);};nav.appendChild(b);}); }
  async function renderUsers(){
    $('#sectionTitle').textContent='إدارة المستخدمين';
    $('#sectionDesc').textContent='إنشاء حسابات للأعضاء وإرسال دعوة آمنة للبريد الإلكتروني وتحديد الصلاحيات.';
    $('#formHost').innerHTML=`<form id="userForm" class="form-grid">
      <label>اسم العضو<input name="full_name" type="text" required maxlength="120" placeholder="الاسم الكامل"></label>
      <label>البريد الإلكتروني<input name="email" type="email" required maxlength="254" placeholder="name@example.com"></label>
      <label>الصلاحية<select name="role" required><option value="employee">موظف</option><option value="admin">مدير النظام</option></select></label>
      <div class="form-actions"><button type="submit">إنشاء الحساب وإرسال الدعوة</button></div>
    </form><p>سيصل للعضو بريد دعوة لإكمال إعداد كلمة المرور. لا تكتب كلمة مرور العضو هنا.</p>`;
    $('#userForm').addEventListener('submit',createManagedUser);
    say('#sectionMsg','');
    const {data,error}=await state.client.from('profiles').select('id,full_name,role,created_at').order('created_at',{ascending:false}).limit(500);
    if(error){$('#tableHead').innerHTML='';$('#tableBody').innerHTML='';say('#sectionMsg','تعذر تحميل المستخدمين: '+error.message,'error');return;}
    $('#tableHead').innerHTML='<tr><th>اسم العضو</th><th>الصلاحية</th><th>تاريخ الإضافة</th></tr>';
    $('#tableBody').innerHTML=(data||[]).length?(data||[]).map(u=>'<tr><td>'+esc(u.full_name||'—')+'</td><td>'+esc(humanRole(u.role||'employee'))+'</td><td>'+esc(u.created_at?new Date(u.created_at).toLocaleDateString('ar-EG'):'—')+'</td></tr>').join(''):'<tr><td class="empty" colspan="3">لا يوجد مستخدمون.</td></tr>';
  }
  async function createManagedUser(e){
    e.preventDefault();
    if(!admin()){say('#sectionMsg','غير مسموح: هذه العملية للإدارة فقط.','error');return;}
    const form=e.currentTarget,btn=form.querySelector('button[type="submit"]'),fd=new FormData(form);
    const body={full_name:String(fd.get('full_name')||'').trim(),email:String(fd.get('email')||'').trim().toLowerCase(),role:String(fd.get('role')||'employee')};
    if(!body.full_name||!body.email){say('#sectionMsg','اكتب اسم العضو والبريد الإلكتروني.','error');return;}
    btn.disabled=true;btn.textContent='جارٍ إنشاء الحساب...';say('#sectionMsg','جارٍ إنشاء الحساب وإرسال دعوة البريد الإلكتروني...');
    try{
      const {data,error}=await state.client.functions.invoke('admin-create-user',{body});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      say('#sectionMsg',data?.message||'تم إنشاء الحساب وإرسال الدعوة.','success');
      form.reset();await renderUsers();
    }catch(err){console.error('Create user error:',err);say('#sectionMsg','لم يتم إنشاء الحساب. '+(err?.message||String(err))+' — تأكد من نشر وظيفة admin-create-user في Supabase وإعدادها.','error');}
    finally{btn.disabled=false;btn.textContent='إنشاء الحساب وإرسال الدعوة';}
  }
  async function loadStats(){const specs=[['staff','العاملون'],['students','الطالبات'],['attendance','سجلات الحضور']];let html='';for(const [t,label] of specs){const {count,error}=await state.client.from(t).select('id',{count:'exact',head:true});html+=`<div class="stat"><strong>${error?'—':(count??0)}</strong><span>${label}</span></div>`;}$('#stats').innerHTML=html;}
  async function getOptions(table){const {data}=await state.client.from(table).select('id,full_name').order('full_name').limit(1000);return data||[];}
  function fieldHTML(f){const [name,label,type='text',required=false,extra]=f;let control='';if(type==='select'){let opts=Array.isArray(extra)?extra.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''):'<option value="">جارٍ التحميل...</option>';control=`<select name="${name}" ${required?'required':''}>${name==='status'||name==='employment_status'||name==='grade'||name==='day_of_week'||name==='leave_type'?'<option value="">اختر...</option>':''}${opts}</select>`;}else if(type==='textarea'){control=`<textarea name="${name}" ${required?'required':''}></textarea>`;}else{control=`<input name="${name}" type="${type}" ${required?'required':''} ${type==='number'?'min="0"':''}>`;}return `<label>${esc(label)}${control}</label>`;}
  async function renderForm(sec){const host=$('#formHost');if(!admin()){host.innerHTML='<p>حسابك يملك صلاحية العرض فقط. لا يمكنك إضافة سجلات.</p>';return;}host.innerHTML=`<form id="recordForm" class="form-grid">${sec.fields.map(fieldHTML).join('')}<div class="form-actions"><button type="submit">حفظ السجل</button></div></form>`;
    for(const f of sec.fields){const [name,,type,,extra]=f;if(type==='select' && (extra==='staff'||extra==='students')){const list=await getOptions(extra);const select=$(`[name="${name}"]`);if(select)select.innerHTML='<option value="">اختر...</option>'+list.map(r=>`<option value="${esc(r.id)}">${esc(r.full_name)}</option>`).join('');}}
    $('#recordForm').addEventListener('submit',e=>saveRecord(e,sec));}
  async function loadSection(key){if(key==='users'){if(!admin()){say('#sectionMsg','ليس لديك صلاحية إدارة المستخدمين.','error');return;}await renderUsers();return;}const sec=sections[key];if(!sec)return;$('#sectionTitle').textContent=sec.title;$('#sectionDesc').textContent=sec.desc;say('#sectionMsg','');await renderForm(sec);
    const selectCols={employees:'id,full_name,employee_no,job_title,specialization,qualification,phone,email,hire_date,employment_status,notes,created_at',students:'*',attendance:'id,student_id,attendance_date,status,notes,created_at',leaves:'*',training_courses:'*',staff_schedules:'*'};
    const {data,error}=await state.client.from(sec.table).select(selectCols[key]||'*').order('created_at',{ascending:false}).limit(500);
    if(error){say('#sectionMsg','تعذر تحميل البيانات: '+error.message,'error');$('#tableHead').innerHTML='';$('#tableBody').innerHTML='';return;}
    const rows=data||[];await enrichRows(key,rows);state.rows=rows;renderRows(sec,rows);
  }
  async function enrichRows(key,rows){const idKey=key==='leaves'||key==='training_courses'||key==='staff_schedules'?'staff_id':'student_id';const ids=[...new Set(rows.map(r=>r[idKey]).filter(Boolean).map(String))];if(!ids.length)return;const table=(key==='attendance')?'students':'staff';const {data}=await state.client.from(table).select('id,full_name').in('id',ids);const names=new Map((data||[]).map(x=>[String(x.id),x.full_name]));rows.forEach(r=>{if(key==='attendance')r.student_name=r.student_name||names.get(String(r.student_id))||'—';else r.staff_name=r.staff_name||names.get(String(r.staff_id))||'—';});}
  function renderRows(sec,rows){const head=$('#tableHead'),body=$('#tableBody');head.innerHTML='<tr>'+sec.columns.map(c=>`<th>${esc(c[1])}</th>`).join('')+'</tr>';if(!rows.length){body.innerHTML=`<tr><td class="empty" colspan="${sec.columns.length}">لا توجد سجلات لعرضها.</td></tr>`;return;}body.innerHTML=rows.map(r=>'<tr>'+sec.columns.map(([key])=>`<td>${esc(r[key]??'—')}</td>`).join('')+'</tr>').join('');}
  async function saveRecord(e,sec){e.preventDefault();say('#sectionMsg','جارٍ الحفظ...');const form=new FormData(e.currentTarget);const data={};for(const f of sec.fields){const [name,,type]=f;const val=form.get(name);if(val!==null&&String(val).trim()!=='')data[name]=type==='number'?Number(val):String(val).trim();}
    if(sec.table==='attendance'){delete data.student_name;delete data.student_number;}
    
    const {error}=await state.client.from(sec.table).insert(data);if(error){say('#sectionMsg','لم يتم الحفظ: '+error.message,'error');return;}e.currentTarget.reset();say('#sectionMsg','تم حفظ السجل بنجاح.','success');await loadSection(state.section);await loadStats();}
  init().catch(e=>{console.error(e);showLogin();say('#loginMsg','حدث خطأ في تشغيل المنظومة: '+(e.message||e),'error');});
})();
