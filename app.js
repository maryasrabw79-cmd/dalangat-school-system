(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const cfg = window.SCHOOL_DB_CONFIG || {};
  const state = { client:null, user:null, profile:null, role:'viewer', section:'employees', pendingAction:null, cache:{employees:[],students:[]}, rows:[], staffRecord:null };
  const sections = {
    employees:{title:'العاملون',table:'staff',desc:'سجل بيانات العاملين بالمدرسة.',fields:[['full_name','اسم الموظف','text',true],['employee_no','الكود','text'],['national_id','الرقم القومي','text'],['birth_date','تاريخ الميلاد','date'],['qualification','المؤهل','text'],['hire_date','تاريخ التعيين','date'],['work_start_date','تاريخ استلام العمل','date'],['specialization','التخصص','text'],['job_title','المسمى الوظيفي','text'],['grade','الدرجة','text'],['grade_date','تاريخ الدرجة','date'],['phone','رقم التليفون','tel'],['marital_status','الحالة الاجتماعية','select',false,['أعزب','متزوج','مطلق','أرمل']],['address','العنوان','textarea']],columns:[['full_name','اسم الموظف'],['employee_no','الكود'],['national_id','الرقم القومي'],['birth_date','تاريخ الميلاد'],['qualification','المؤهل'],['hire_date','تاريخ التعيين'],['work_start_date','تاريخ استلام العمل'],['specialization','التخصص'],['job_title','المسمى الوظيفي'],['grade','الدرجة'],['grade_date','تاريخ الدرجة'],['phone','رقم التليفون'],['marital_status','الحالة الاجتماعية'],['address','العنوان']]},
    students:{title:'الطالبات',table:'students',desc:'سجل بيانات الطالبات وقيدهن.',fields:[['full_name','اسم الطالبة','text',true],['student_code','كود الطالبة','text',true],['grade','الصف الدراسي','select',true,['الأول','الثاني','الثالث']],['section','الفصل','text'],['specialization','التخصص','select',true,['فني تكنولوجيا الحاسبات','فني الأجهزة الإلكترونية','فني الملابس الجاهزة']],['enrollment_status','حالة القيد','select',true,['مقيدة','منقطعة','محولة','متخرجة']],['birth_date','تاريخ الميلاد','date'],['guardian_name','اسم ولي الأمر','text'],['guardian_phone','هاتف ولي الأمر','tel']],columns:[['full_name','اسم الطالبة'],['student_code','كود الطالبة'],['grade','الصف'],['section','الفصل'],['specialization','التخصص'],['enrollment_status','الحالة']]},
    attendance:{title:'الحضور والغياب',table:'attendance',desc:'تسجيل حضور الطالبات أو غيابهن.',fields:[['student_id','الطالبة','select',true,'students'],['attendance_date','التاريخ','date',true],['status','الحالة','select',true,['حضور','غياب','تأخير','إذن']],['notes','ملاحظات','textarea']],columns:[['student_name','الطالبة'],['attendance_date','التاريخ'],['status','الحالة'],['notes','ملاحظات']]},
    leaves:{title:'الإجازات',table:'staff_leaves',desc:'تسجيل ومتابعة إجازات العاملين.',fields:[['staff_id','العامل','select',true,'staff'],['leave_type','نوع الإجازة','select',true,['اعتيادية','عارضة','مرضية','بدون مرتب','أخرى']],['start_date','من تاريخ','date',true],['end_date','إلى تاريخ','date',true],['status','حالة الطلب','select',true,['قيد المراجعة','مقبولة','مرفوضة']],['notes','ملاحظات','textarea']],columns:[['staff_name','العامل'],['leave_type','نوع الإجازة'],['start_date','من'],['end_date','إلى'],['status','الحالة'],['notes','ملاحظات']]},
    training_courses:{title:'التدريب',table:'training_courses',desc:'إدارة الدورات التدريبية ومتابعتها.',fields:[['staff_id','العامل/المتدرب','select',true,'staff'],['course_name','اسم الدورة','text',true],['provider','الجهة المنظمة','text'],['start_date','تاريخ البداية','date'],['end_date','تاريخ النهاية','date'],['hours','عدد الساعات','number'],['certificate_no','رقم الشهادة','text'],['notes','ملاحظات','textarea']],columns:[['staff_name','العامل/المتدرب'],['course_name','الدورة'],['provider','الجهة المنظمة'],['start_date','البداية'],['end_date','النهاية'],['hours','الساعات']]},
    staff_schedules:{title:'الجداول',table:'staff_schedules',desc:'إدارة الجداول المدرسية والحصص.',fields:[['staff_id','المعلم/المعلمة','select',true,'staff'],['day_of_week','اليوم','select',true,['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس']],['period_no','رقم الحصة','number',true],['subject_or_task','المادة / المهمة','text',true],['class_or_location','الفصل / المكان','text'],['academic_year','العام الدراسي','text']],columns:[['staff_name','المعلم/المعلمة'],['day_of_week','اليوم'],['period_no','الحصة'],['subject_or_task','المادة / المهمة'],['class_or_location','الفصل / المكان'],['academic_year','العام الدراسي']]}
  };
  const admin = () => state.role === 'admin';
  const say = (id,msg,type='') => { const el=$(id); if(el){el.textContent=msg;el.className='message '+type;} };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const humanRole = r => ({admin:'مدير النظام',manager:'إدارة المدرسة',principal:'مدير المدرسة',viewer:'عرض فقط',employee:'موظف',pending:'بانتظار موافقة المدير'})[r] || r;
  async function init(){
    if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey || cfg.supabaseUrl.includes('YOUR-PROJECT')){
      showLogin(); say('#loginMsg','إعدادات Supabase غير مكتملة. راجع ملف config.js.','error'); return;
    }
    state.client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    $('#loginForm').addEventListener('submit',login); $('#registerForm').addEventListener('submit',activateAccount); $('#showRegisterBtn').addEventListener('click',showRegister); $('#backToLoginBtn').addEventListener('click',showLogin); $('#logoutBtn').addEventListener('click',logout); $('#refreshBtn').addEventListener('click',()=>loadSection(state.section)); $('#homeBtn').addEventListener('click',showHome); $('#exportSelectedBtn').addEventListener('click',()=>exportReportsToExcel($('#exportSectionSelect').value));
    $('#homeTabs').querySelectorAll('[data-home-section]').forEach(b=>b.addEventListener('click',()=>openHomeSelection(b.dataset.homeSection)));
    state.client.auth.onAuthStateChange((_event,session)=>{ if(session?.user){ state.user=session.user; setTimeout(loadProfile,0); } else { state.user=null; state.profile=null; showLogin(); }});
    const {data:{session}}=await state.client.auth.getSession(); if(session?.user){state.user=session.user;await loadProfile();} else showHome();
  }
  function showHome(){ $('#homeView').classList.remove('hidden'); $('#loginView').classList.add('hidden'); $('#registerView').classList.add('hidden'); $('#appView').classList.add('hidden'); $('#logoutBtn').classList.toggle('hidden',!state.user); $('#homeBtn').classList.remove('hidden'); }
  function showLogin(){ $('#homeView').classList.add('hidden'); $('#registerView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden'); $('#logoutBtn').classList.add('hidden'); $('#homeBtn').classList.remove('hidden'); }
  function showRegister(){ $('#homeView').classList.add('hidden'); $('#loginView').classList.add('hidden'); $('#registerView').classList.remove('hidden'); $('#appView').classList.add('hidden'); $('#logoutBtn').classList.add('hidden'); $('#homeBtn').classList.remove('hidden'); say('#registerMsg',''); }
  async function openHomeSelection(key){
    const action=key==='export'?'export':key;
    if(!state.user||!state.profile){state.pendingAction=action;showLogin();return;}
    if(action==='export'){showExportOptions();$('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');return;}
    if(action==='users'&&!admin()){say('#sectionMsg','ليس لديك صلاحية إدارة المستخدمين.','error');return;}
    if(!sections[action]&&action!=='users'&&action!=='national_ids')return;
    if(!allowedSections().includes(action)){say('#sectionMsg','هذا القسم غير متاح لصلاحية حسابك.','error');return;}
    state.section=action;$('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');$('#exportView').classList.add('hidden');$('#dataView').classList.remove('hidden');renderTabs();await loadSection(action);
  }
  function showExportOptions(){ $('#exportView').classList.remove('hidden'); $('#dataView').classList.add('hidden'); const select=$('#exportSectionSelect'); const keys=admin()?[...Object.keys(sections),'national_ids','users']:allowedSections().filter(k=>k!=='users'); select.innerHTML=keys.map(k=>`<option value="${esc(k)}">${esc(k==='users'?'إدارة المستخدمين':k==='national_ids'?'إضافة الأرقام القومية المسموح لها بالتسجيل':sections[k]?.title||k)}</option>`).join(''); $('#exportMsg').textContent=''; }
  async function login(e){
    e.preventDefault();
    const button=$('#loginForm button[type="submit"]');
    if(!state.client){say('#loginMsg','لم يتم الاتصال بخدمة تسجيل الدخول. حدّث الصفحة، وإذا استمرت المشكلة أرسل لي نص الرسالة.','error');return;}
    if(button){button.disabled=true;button.textContent='جارٍ التحقق...';}
    say('#loginMsg','جارٍ التحقق من بيانات الدخول...');
    try{
      const loginId=$('#loginNationalId').value.trim(); const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)?loginId.toLowerCase():(/^\d{14}$/.test(loginId)?staffLoginEmail(loginId):''); if(!email){say('#loginMsg','اكتب رقمًا قوميًّا من 14 رقمًا، أو البريد الإلكتروني المعتمد لمدير النظام.','error');return;} const {data,error}=await state.client.auth.signInWithPassword({email,password:$('#loginPassword').value});
      if(error){say('#loginMsg','تعذر الدخول: '+error.message,'error');return;}
      if(data?.user){say('#loginMsg','تم التحقق من الحساب، جارٍ تحميل صلاحياته...','success');}
      else{say('#loginMsg','لم يتم تسجيل الدخول. تأكد من الرقم القومي وكلمة المرور، أو فعّل حسابك أولًا.','error');}
    }catch(err){console.error('Login error:',err);say('#loginMsg','حدث خطأ أثناء محاولة الدخول: '+(err?.message||String(err)),'error');}
    finally{if(button){button.disabled=false;button.textContent='دخول';}}
  }
  function staffLoginEmail(nationalId){return 'staff_'+nationalId+'@login.dalangat-school.com';}
  async function callAccessFunction(payload,token=null){
    const headers={'Content-Type':'application/json','apikey':cfg.supabaseAnonKey};
    if(token)headers.Authorization='Bearer '+token;
    const response=await fetch(cfg.supabaseUrl+'/functions/v1/staff-account-access',{method:'POST',headers,body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>({error:'استجابة غير مفهومة من خادم التفعيل.'}));
    if(!response.ok)throw new Error(result.error||'تعذر تنفيذ الطلب.');
    return result;
  }
  async function activateAccount(e){
    e.preventDefault();
    const form=e.currentTarget,btn=form.querySelector('button[type="submit"]');
    const nationalId=$('#registerNationalId').value.trim(),code=$('#activationCode').value.trim(),password=$('#registerPassword').value,confirm=$('#registerPasswordConfirm').value;
    if(!/^\d{14}$/.test(nationalId)){say('#registerMsg','الرقم القومي يجب أن يتكون من 14 رقمًا.','error');return;}
    if(code.length<12){say('#registerMsg','اكتب رمز التفعيل كاملًا كما تسلمته من المدير.','error');return;}
    if(password.length<8){say('#registerMsg','كلمة المرور يجب ألا تقل عن 8 أحرف.','error');return;}
    if(password!==confirm){say('#registerMsg','كلمتا المرور غير متطابقتين.','error');return;}
    btn.disabled=true;btn.textContent='جارٍ تفعيل الحساب...';say('#registerMsg','جارٍ التحقق من رمز التفعيل وإنشاء الحساب...');
    try{
      await callAccessFunction({action:'activate',national_id:nationalId,activation_code:code,password});
      form.reset();showLogin();$('#loginNationalId').value=nationalId;
      say('#loginMsg','تم تفعيل الحساب. يمكنك الآن الدخول بالرقم القومي وكلمة المرور التي أنشأتها.','success');
    }catch(err){console.error('Account activation error:',err);say('#registerMsg','تعذر تفعيل الحساب: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=false;btn.textContent='تفعيل الحساب وإنشاء كلمة المرور';}
  }
  async function logout(){await state.client.auth.signOut();showHome();}
  async function loadProfile(){
    const {data,error}=await state.client.from('profiles').select('*').eq('id',state.user.id).maybeSingle();
    if(error){ showLogin();say('#loginMsg','تعذر قراءة صلاحيات الحساب: '+error.message,'error');return; }
    if(!data){showLogin();say('#loginMsg','تم الدخول، لكن لا يوجد سجل لهذا الحساب في profiles. اطلب من مسؤول النظام ربط الحساب بملف وصلاحية.','error');return;}
    state.profile=data;state.role=String(data.role||'viewer').toLowerCase();
    if(state.role==='pending'){
      await state.client.auth.signOut();
      showLogin();
      say('#loginMsg','حسابك مسجل بنجاح لكنه ينتظر موافقة مدير النظام. ستتمكن من الدخول بعد اعتماد الحساب.','error');
      return;
    }
    $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');$('#welcomeTitle').textContent='أهلًا بك في منظومة المدرسة';$('#roleLabel').textContent='صلاحيتك: '+humanRole(state.role);
    renderTabs(); await loadStats(); const requested=state.pendingAction; state.pendingAction=null; if(requested==='export'){showExportOptions();return;} if(requested&&requested!=='users'&&sections[requested]&&allowedSections().includes(requested))state.section=requested; else if(requested==='users'&&admin())state.section='users'; if(!allowedSections().includes(state.section))state.section=allowedSections()[0]||'employees'; renderTabs(); $('#exportView').classList.add('hidden'); $('#dataView').classList.remove('hidden'); await loadSection(state.section);
  }
  function allowedSections(){ if(admin())return [...Object.keys(sections),'national_ids','users']; if(state.role==='employee')return ['employees','leaves','training_courses']; return []; }
  function renderTabs(){ const nav=$('#tabs');nav.innerHTML=''; const allowed=allowedSections(); if(!allowed.length){nav.innerHTML='<span>لا توجد أقسام متاحة لهذا الحساب.</span>';return;} if(!allowed.includes(state.section))state.section=allowed[0]; allowed.forEach(key=>{const b=document.createElement('button');b.className='tab'+(key===state.section?' active':'');b.textContent=key==='users'?'إدارة المستخدمين':key==='national_ids'?'إضافة الأرقام القومية':sections[key].title;b.onclick=()=>{state.section=key;renderTabs();loadSection(key);};nav.appendChild(b);}); }
  async function renderUsers(){
    $('#sectionTitle').textContent='إدارة المستخدمين';
    $('#sectionDesc').textContent='مراجعة الحسابات الجديدة واعتمادها وإدارة صلاحيات المستخدمين.';
    $('#formHost').innerHTML=`<p>يمكن للموظفين إنشاء حساب بأنفسهم. الحساب الجديد لا يعمل إلا بعد موافقة المدير. ويمكنك الاستمرار في إنشاء الحسابات بالدعوة عند الحاجة.</p><form id="userForm" class="form-grid">
      <label>اسم العضو<input name="full_name" type="text" required maxlength="120" placeholder="الاسم الكامل"></label>
      <label>البريد الإلكتروني<input name="email" type="email" required maxlength="254" placeholder="name@example.com"></label>
      <label>الصلاحية<select name="role" required><option value="employee">موظف</option><option value="admin">مدير النظام</option></select></label>
      <div class="form-actions"><button type="submit">إنشاء الحساب وإرسال الدعوة</button></div>
    </form>`;
    $('#userForm').addEventListener('submit',createManagedUser);
    say('#sectionMsg','');
    const {data,error}=await state.client.from('profiles').select('id,full_name,role,created_at').order('created_at',{ascending:false}).limit(500);
    if(error){$('#tableHead').innerHTML='';$('#tableBody').innerHTML='';say('#sectionMsg','تعذر تحميل المستخدمين: '+error.message,'error');return;}
    $('#tableHead').innerHTML='<tr><th>اسم العضو</th><th>الصلاحية</th><th>تاريخ الإضافة</th><th>الإجراء</th></tr>';
    $('#tableBody').innerHTML=(data||[]).length?(data||[]).map(u=>'<tr><td>'+esc(u.full_name||'—')+'</td><td>'+esc(humanRole(u.role||'employee'))+'</td><td>'+esc(u.created_at?new Date(u.created_at).toLocaleDateString('ar-EG'):'—')+'</td><td>'+(u.id===state.user.id?'<span>حسابك الحالي</span>':(u.role==='pending'?'<button type="button" class="approve-user-btn" data-user-id="'+esc(u.id)+'" data-user-name="'+esc(u.full_name||u.id)+'">اعتماد كموظف</button> ':'')+'<button type="button" class="secondary remove-user-btn" data-user-id="'+esc(u.id)+'" data-user-name="'+esc(u.full_name||u.id)+'">إزالة العضو</button>')+'</td></tr>').join(''):'<tr><td class="empty" colspan="4">لا يوجد مستخدمون.</td></tr>';
    $('#tableBody').querySelectorAll('.remove-user-btn').forEach(btn=>btn.addEventListener('click',removeManagedUser));
    $('#tableBody').querySelectorAll('.approve-user-btn').forEach(btn=>btn.addEventListener('click',approvePendingUser));
  }
  async function approvePendingUser(e){
    const btn=e.currentTarget, userId=btn.dataset.userId, userName=btn.dataset.userName||'المستخدم';
    if(!admin()||!userId)return;
    if(!window.confirm('اعتماد حساب «'+userName+'» كموظف والسماح له بالدخول؟'))return;
    btn.disabled=true;btn.textContent='جارٍ الاعتماد...';
    const {error}=await state.client.from('profiles').update({role:'employee'}).eq('id',userId).eq('role','pending');
    if(error){say('#sectionMsg','تعذر اعتماد الحساب: '+error.message,'error');btn.disabled=false;btn.textContent='اعتماد كموظف';return;}
    say('#sectionMsg','تم اعتماد الحساب كموظف.','success');await renderUsers();
  }
  async function removeManagedUser(e){
    const btn=e.currentTarget;
    if(!admin()){say('#sectionMsg','غير مسموح: إزالة الأعضاء لمدير النظام فقط.','error');return;}
    const userId=btn.dataset.userId, userName=btn.dataset.userName||'هذا العضو';
    if(!userId||userId===state.user.id)return;
    if(!window.confirm('هل تريد إزالة العضو «'+userName+'» نهائيًا من حسابات المنظومة؟ لن يتم حذف سجلات المدرسة المرتبطة به تلقائيًا.'))return;
    if(!window.confirm('تأكيد أخير: سيتم حذف حساب الدخول لهذا العضو. هل تريد المتابعة؟'))return;
    btn.disabled=true;btn.textContent='جارٍ الإزالة...';say('#sectionMsg','جارٍ إزالة الحساب...');
    try{
      const {data,error}=await state.client.functions.invoke('admin-remove-user',{body:{user_id:userId}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      say('#sectionMsg',data?.message||'تمت إزالة العضو.','success');
      await renderUsers();
    }catch(err){
      console.error('Remove user error:',err);
      say('#sectionMsg','تعذر إزالة العضو: '+(err?.message||String(err)),'error');
      btn.disabled=false;btn.textContent='إزالة العضو';
    }
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
  const reportLabels = {
    id:'المعرّف', full_name:'اسم الموظف', employee_no:'الكود', national_id:'الرقم القومي', birth_date:'تاريخ الميلاد', work_start_date:'تاريخ استلام العمل', grade:'الدرجة', grade_date:'تاريخ الدرجة', marital_status:'الحالة الاجتماعية', address:'العنوان', job_title:'المسمى الوظيفي',
    specialization:'التخصص', qualification:'المؤهل', phone:'رقم التليفون', email:'البريد الإلكتروني',
    hire_date:'تاريخ التعيين', employment_status:'حالة العمل', notes:'ملاحظات', created_at:'تاريخ الإضافة',
    student_code:'كود الطالبة', grade:'الصف الدراسي', section:'الفصل', enrollment_status:'حالة القيد',
    birth_date:'تاريخ الميلاد', guardian_name:'اسم ولي الأمر', guardian_phone:'هاتف ولي الأمر',
    student_id:'معرّف الطالبة', student_name:'اسم الطالبة', attendance_date:'تاريخ الحضور', status:'الحالة',
    staff_id:'معرّف العامل', staff_name:'اسم العامل', leave_type:'نوع الإجازة', start_date:'تاريخ البداية',
    end_date:'تاريخ النهاية', course_name:'اسم الدورة', provider:'الجهة المنظمة', hours:'عدد الساعات',
    certificate_no:'رقم الشهادة', day_of_week:'اليوم', period_no:'رقم الحصة', subject_or_task:'المادة / المهمة',
    class_or_location:'الفصل / المكان', academic_year:'العام الدراسي', role:'الصلاحية'
  };
  async function fetchAllRows(table, columns='*'){
    const all=[]; const batchSize=1000;
    for(let from=0; ; from+=batchSize){
      const {data,error}=await state.client.from(table).select(columns).range(from,from+batchSize-1);
      if(error)throw new Error('تعذر قراءة جدول '+table+': '+error.message);
      const batch=data||[]; all.push(...batch);
      if(batch.length<batchSize)break;
    }
    return all;
  }
  async function exportReportsToExcel(selectedKey){
    const btn=$('#exportSelectedBtn');
    if(!window.XLSX){say('#exportMsg','مكتبة Excel لم تُحمّل. تحقق من اتصال الإنترنت ثم حدّث الصفحة.','error');return;}
    btn.disabled=true;const oldText=btn.textContent;btn.textContent='جارٍ تجهيز ملف Excel...';
    say('#exportMsg','جارٍ جمع بيانات القسم المحدد وتجهيز ملف Excel...');
    try{
      const permitted=admin()?[...Object.keys(sections),'users']:allowedSections().filter(k=>k!=='users');
      if(!permitted.includes(selectedKey))throw new Error('هذا القسم غير متاح لصلاحية حسابك.');
      const keys=[selectedKey];
      const wb=window.XLSX.utils.book_new();
      for(const key of keys){
        if(key==='users')continue;
        const sec=sections[key]; if(!sec)continue;
        let rows=await fetchAllRows(sec.table);
        if(key==='attendance'||key==='leaves'||key==='training_courses'||key==='staff_schedules'){
          const isAttendance=key==='attendance';
          const foreignKey=isAttendance?'student_id':'staff_id';
          const ids=[...new Set(rows.map(r=>r[foreignKey]).filter(Boolean).map(String))];
          if(ids.length){
            const targetTable=isAttendance?'students':'staff';
            const {data,error}=await state.client.from(targetTable).select('id,full_name').in('id',ids);
            if(error)throw new Error('تعذر جلب أسماء السجلات المرتبطة: '+error.message);
            const names=new Map((data||[]).map(r=>[String(r.id),r.full_name||'—']));
            rows=rows.map(r=>({...r,[isAttendance?'student_name':'staff_name']:names.get(String(r[foreignKey]))||'—'}));
          }
        }
        const preferred=sec.columns.map(([key])=>key);
        const extras=key==='employees'?[]:[...new Set(rows.flatMap(r=>Object.keys(r)))].filter(k=>!preferred.includes(k)&&k!=='id'&&k!=='student_id'&&k!=='staff_id');
        const cols=[...preferred,...extras];
        const data=[cols.map(k=>reportLabels[k]||k),...rows.map(r=>cols.map(k=>r[k]===null||r[k]===undefined?'':r[k]))];
        const ws=window.XLSX.utils.aoa_to_sheet(data);
        ws['!views']=[{rightToLeft:true}];
        ws['!cols']=cols.map(k=>({wch:Math.min(32,Math.max(14,(reportLabels[k]||k).length+4))}));
        window.XLSX.utils.book_append_sheet(wb,ws,sec.title.slice(0,31));
      }
      if(selectedKey==='users'&&admin()){
        const users=await fetchAllRows('profiles','full_name,role,created_at');
        const userCols=['full_name','role','created_at'];
        const userData=[[...userCols.map(k=>reportLabels[k]||k)],...users.map(u=>userCols.map(k=>k==='role'?humanRole(u[k]||'employee'):(u[k]??'')))];
        const ws=window.XLSX.utils.aoa_to_sheet(userData);ws['!views']=[{rightToLeft:true}];ws['!cols']=[{wch:28},{wch:20},{wch:18}];
        window.XLSX.utils.book_append_sheet(wb,ws,'إدارة المستخدمين');
      }
      const stamp=new Date().toISOString().slice(0,10);
      window.XLSX.writeFile(wb,'تقارير_مدرسة_الدلنجات_'+stamp+'.xlsx');
      say('#exportMsg','تم تصدير القسم المحدد إلى ملف Excel.','success');
    }catch(err){
      console.error('Excel export error:',err);
      say('#exportMsg','تعذر إنشاء تقرير Excel: '+(err?.message||String(err)),'error');
    }finally{btn.disabled=false;btn.textContent=oldText;}
  }
  async function loadStats(){const specs=[['staff','العاملون'],['students','الطالبات'],['attendance','سجلات الحضور']];let html='';for(const [t,label] of specs){const {count,error}=await state.client.from(t).select('id',{count:'exact',head:true});html+=`<div class="stat"><strong>${error?'—':(count??0)}</strong><span>${label}</span></div>`;}$('#stats').innerHTML=html;}
  async function getOptions(table){const {data}=await state.client.from(table).select('id,full_name').order('full_name').limit(1000);return data||[];}
  function fieldHTML(f){const [name,label,type='text',required=false,extra]=f;let control='';if(type==='select'){let opts=Array.isArray(extra)?extra.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''):'<option value="">جارٍ التحميل...</option>';control=`<select name="${name}" ${required?'required':''}>${name==='status'||name==='employment_status'||name==='grade'||name==='day_of_week'||name==='leave_type'?'<option value="">اختر...</option>':''}${opts}</select>`;}else if(type==='textarea'){control=`<textarea name="${name}" ${required?'required':''}></textarea>`;}else{control=`<input name="${name}" type="${type}" ${required?'required':''} ${type==='number'?'min="0"':''}>`;}return `<label>${esc(label)}${control}</label>`;}
  async function renderForm(sec){
    const host=$('#formHost'), employeeMode=!admin()&&state.role==='employee';
    if(!admin()&&!employeeMode){host.innerHTML='<p>لا تملك صلاحية تعديل هذا القسم.</p>';return;}
    let fields=sec.fields;
    if(employeeMode&&sec.table==='staff') fields=sec.fields.filter(f=>f[0]!=='national_id');
    if(employeeMode&&sec.table==='staff_leaves') fields=sec.fields.filter(f=>!['staff_id','status'].includes(f[0]));
    if(employeeMode&&sec.table==='training_courses') fields=sec.fields.filter(f=>f[0]!=='staff_id');
    host.innerHTML=`<form id="recordForm" class="form-grid">${fields.map(fieldHTML).join('')}<div class="form-actions"><button type="submit">${employeeMode&&sec.table==='staff'?'حفظ بياناتي':'حفظ'}</button></div></form>`;
    for(const f of fields){const [name,,type,,extra]=f;if(type==='select'&&(extra==='staff'||extra==='students')){const list=await getOptions(extra);const select=$(`[name="${name}"]`);if(select)select.innerHTML='<option value="">اختر...</option>'+list.map(r=>`<option value="${esc(r.id)}">${esc(r.full_name)}</option>`).join('');}}
    if(employeeMode&&sec.table==='staff'&&state.staffRecord){for(const f of fields){const el=$(`[name="${f[0]}"]`);if(el)el.value=state.staffRecord[f[0]]??'';}}
    $('#recordForm').addEventListener('submit',e=>saveRecord(e,sec));
  }

  async function renderNationalIdsForm(){
    $('#sectionTitle').textContent='إضافة الأرقام القومية دفعة واحدة';
    $('#sectionDesc').textContent='أدخل الأرقام القومية فقط، كل رقم في سطر مستقل، دون كود موظف أو اسم.';
    $('#tableHead').innerHTML='';$('#tableBody').innerHTML='';say('#sectionMsg','');
    $('#formHost').innerHTML=`<div class="bulk-id-help"><p><strong>طريقة الإدخال:</strong> رقم قومي واحد من 14 رقمًا في كل سطر. لا تحتاج إلى كود موظف أو اسم.</p><p>مثال توضيحي: <code>12345678901234</code></p><label for="bulkNationalIds">الأرقام القومية</label><textarea id="bulkNationalIds" rows="10" placeholder="12345678901234&#10229;23456789012345"></textarea><div class="form-actions"><button id="previewNationalIds" type="button" class="secondary">مراجعة الأرقام</button><button id="saveNationalIds" type="button">حفظ الأرقام القومية</button><button id="issueActivationCodes" type="button">إصدار رموز التفعيل</button></div><div id="bulkIdPreview" class="message" aria-live="polite"></div><div id="activationCodesResult" class="message" aria-live="polite"></div></div>`;
    $('#previewNationalIds').addEventListener('click',()=>previewNationalIdRows(false));
    $('#saveNationalIds').addEventListener('click',()=>previewNationalIdRows(true)); $('#issueActivationCodes').addEventListener('click',issueActivationCodes);
  }
  async function previewNationalIdRows(save){
    const out=$('#bulkIdPreview');
    out.className='message';
    out.textContent='جارٍ فحص الأرقام القومية...';
    const lines=$('#bulkNationalIds').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!lines.length){out.className='message error';out.textContent='أدخل رقمًا قوميًا واحدًا على الأقل.';return;}
    const ids=[],issues=[],seen=new Set();
    for(let i=0;i<lines.length;i++){
      const id=lines[i].replace(/[\s-]/g,'');
      if(!/^\d{14}$/.test(id)){issues.push('السطر '+(i+1)+': يجب أن يتكون الرقم من 14 رقمًا.');continue;}
      if(seen.has(id)){issues.push('السطر '+(i+1)+': الرقم مكرر في القائمة.');continue;}
      seen.add(id);ids.push(id);
    }
    if(!ids.length){out.className='message error';out.textContent=issues.join(' | ')||'لا توجد أرقام صالحة.';return;}
    const {data:staff,error}=await state.client.from('staff').select('id,national_id,auth_user_id,activation_used_at');
    if(error){out.className='message error';out.textContent='تعذر قراءة سجل العاملين: '+error.message;return;}
    const existing=new Set(staff.filter(r=>r.national_id).map(r=>String(r.national_id).trim()));
    const fresh=ids.filter(id=>!existing.has(id));
    const already=ids.length-fresh.length;
    if(!save){
      out.className='message '+(issues.length?'error':'success');
      out.textContent='الأرقام الصحيحة: '+ids.length+'؛ سجلات جديدة ستُنشأ: '+fresh.length+'؛ موجودة مسبقًا: '+already+'. '+(issues.length?'ملاحظات: '+issues.join(' | '):'يمكنك الآن الضغط على «حفظ الأرقام القومية».');
      return;
    }
    if(!fresh.length){
      out.className='message '+(issues.length?'error':'success');
      out.textContent='لا توجد سجلات جديدة لإضافتها. الموجود مسبقًا: '+already+'. '+(issues.length?issues.join(' | '):'إذا كانت هذه الحسابات غير مفعلة، يمكنك تجربة «إصدار رموز التفعيل».');
      return;
    }
    const button=$('#saveNationalIds');button.disabled=true;
    let saved=0;const failed=[];
    try{
      for(const id of fresh){
        const {error:saveError}=await state.client.from('staff').insert({full_name:'موظف جديد',national_id:id,employment_status:'على رأس العمل',notes:'سجل مبدئي أُنشئ من قائمة الأرقام القومية؛ يُستكمل الاسم والبيانات بواسطة الإدارة.'});
        if(saveError)failed.push(id+': '+saveError.message);else saved++;
      }
      out.className='message '+(failed.length||issues.length?'error':'success');
      out.textContent='تم إنشاء '+saved+' سجل مبدئي جديد. لم يتم حذف أو استبدال أي رقم قومي محفوظ مسبقًا؛ الموجود مسبقًا: '+already+'. '+(failed.length?'تعذر حفظ بعض الأرقام: '+failed.join(' | ')+'. ':'')+(issues.length?' ملاحظات: '+issues.join(' | '):'')+' بعد ذلك اضغط «إصدار رموز التفعيل». ستظهر الأسماء مؤقتًا باسم «موظف جديد» حتى تستكملها الإدارة.';
    }finally{button.disabled=false;}
  }

  async function issueActivationCodes(){
    const out=$('#activationCodesResult'),button=$('#issueActivationCodes');
    out.className='message';out.textContent='جارٍ إصدار رموز التفعيل للحسابات غير المفعلة...';button.disabled=true;
    try{
      const {data:{session}}=await state.client.auth.getSession();
      if(!session?.access_token)throw new Error('انتهت جلسة الدخول. سجّل الدخول مرة أخرى.');
      const result=await callAccessFunction({action:'issue_codes'},session.access_token);
      out.className='message success';
      out.textContent=result.codes?.length?'احتفظ بهذه الرموز وسلّم كل رمز لصاحبه مباشرة. لن تظهر الرموز مرة أخرى بعد إغلاق هذه الرسالة. صلاحيتها 7 أيام. '+result.codes.map(x=>x.employee_no+' — '+x.full_name+' — '+x.activation_code).join(' | '):'لا توجد حسابات جديدة جاهزة لإصدار رموز لها. أضف الأرقام القومية أولًا وتأكد أن الحسابات لم تُفعّل من قبل.';
    }catch(err){out.className='message error';out.textContent='تعذر إصدار الرموز: '+(err?.message||String(err));}
    finally{button.disabled=false;}
  }
  async function loadSection(key){
    if(key==='national_ids'){if(!admin()){say('#sectionMsg','هذا النموذج متاح لمدير النظام فقط.','error');return;}await renderNationalIdsForm();return;}
    if(key==='users'){if(!admin()){say('#sectionMsg','ليس لديك صلاحية إدارة المستخدمين.','error');return;}await renderUsers();return;}
    const sec=sections[key];if(!sec)return;
    if(!admin()&&!allowedSections().includes(key)){say('#sectionMsg','هذا القسم غير متاح لصلاحية حسابك.','error');return;}
    $('#sectionTitle').textContent=sec.title;$('#sectionDesc').textContent=sec.desc;say('#sectionMsg','');
    if(!admin()&&key==='employees'){
      const {data,error}=await state.client.from('staff').select('id,full_name,employee_no,birth_date,qualification,hire_date,work_start_date,specialization,job_title,grade,grade_date,phone,marital_status,address').eq('auth_user_id',state.user.id).maybeSingle();
      if(error){say('#sectionMsg','تعذر تحميل بياناتك: '+error.message,'error');return;}
      state.staffRecord=data||null;
      if(!data){$('#formHost').innerHTML='<p>لم يتم ربط حسابك بسجل العاملين بعد. يرجى مراجعة مدير النظام.</p>';$('#tableHead').innerHTML='';$('#tableBody').innerHTML='';return;}
    }
    if(!admin()&&['leaves','training_courses'].includes(key)&&!state.staffRecord){
      const {data,error}=await state.client.from('staff').select('id,full_name,employee_no').eq('auth_user_id',state.user.id).maybeSingle();
      if(error||!data){say('#sectionMsg','لم يتم ربط حسابك بسجل العاملين بعد. يرجى مراجعة مدير النظام.','error');return;}
      state.staffRecord=data;
    }
    await renderForm(sec);
    const selectCols={employees:admin()?'id,full_name,employee_no,national_id,birth_date,qualification,hire_date,work_start_date,specialization,job_title,grade,grade_date,phone,marital_status,address,created_at':'id,full_name,employee_no,birth_date,qualification,hire_date,work_start_date,specialization,job_title,grade,grade_date,phone,marital_status,address,created_at',students:'*',attendance:'id,student_id,attendance_date,status,notes,created_at',leaves:'*',training_courses:'*',staff_schedules:'*'};
    let query=state.client.from(sec.table).select(selectCols[key]||'*');
    if(!admin()&&['leaves','training_courses'].includes(key))query=query.eq('staff_id',state.staffRecord.id);
    if(!admin()&&key==='employees')query=query.eq('auth_user_id',state.user.id);
    const {data,error}=await query.order('created_at',{ascending:false}).limit(500);
    if(error){say('#sectionMsg','تعذر تحميل البيانات: '+error.message,'error');$('#tableHead').innerHTML='';$('#tableBody').innerHTML='';return;}
    const rows=data||[];await enrichRows(key,rows);state.rows=rows;renderRows(sec,rows);
  }
  async function enrichRows(key,rows){const idKey=key==='leaves'||key==='training_courses'||key==='staff_schedules'?'staff_id':'student_id';const ids=[...new Set(rows.map(r=>r[idKey]).filter(Boolean).map(String))];if(!ids.length)return;const table=(key==='attendance')?'students':'staff';const {data}=await state.client.from(table).select('id,full_name').in('id',ids);const names=new Map((data||[]).map(x=>[String(x.id),x.full_name]));rows.forEach(r=>{if(key==='attendance')r.student_name=r.student_name||names.get(String(r.student_id))||'—';else r.staff_name=r.staff_name||names.get(String(r.staff_id))||'—';});}
  function renderRows(sec,rows){
    const head=$('#tableHead'),body=$('#tableBody'),canDelete=admin()&&['staff','students','staff_leaves','training_courses'].includes(sec.table);
    head.innerHTML='<tr>'+sec.columns.map(c=>`<th>${esc(c[1])}</th>`).join('')+(canDelete?'<th>إجراء</th>':'')+'</tr>';
    if(!rows.length){body.innerHTML=`<tr><td class="empty" colspan="${sec.columns.length+(canDelete?1:0)}">لا توجد سجلات لعرضها.</td></tr>`;return;}
    body.innerHTML=rows.map(r=>'<tr>'+sec.columns.map(([key])=>`<td>${esc(r[key]??'—')}</td>`).join('')+(canDelete?`<td><button type="button" class="secondary delete-record-btn" data-record-id="${esc(r.id)}" data-record-name="${esc(r.full_name||r.student_code||r.course_name||r.leave_type||'هذا السجل')}" data-table="${esc(sec.table)}">إزالة</button></td>`:'')+'</tr>').join('');
    body.querySelectorAll('.delete-record-btn').forEach(btn=>btn.addEventListener('click',removeRecord));
  }
  async function removeRecord(e){
    const btn=e.currentTarget,table=btn.dataset.table,id=btn.dataset.recordId,name=btn.dataset.recordName||'هذا السجل';
    const labels={staff:'الموظف',students:'الطالبة',staff_leaves:'الإجازة',training_courses:'سجل التدريب'};
    if(!admin()||!['staff','students','staff_leaves','training_courses'].includes(table)||!id)return;
    if(!window.confirm('هل تريد إزالة '+(labels[table]||'السجل')+' «'+name+'» نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.'))return;
    btn.disabled=true;btn.textContent='جارٍ الإزالة...';
    const {error}=await state.client.from(table).delete().eq('id',id);
    if(error){
      say('#sectionMsg','تعذر إزالة السجل: '+error.message+' قد يكون مرتبطًا بسجلات أخرى.','error');
      btn.disabled=false;btn.textContent='إزالة';return;
    }
    say('#sectionMsg','تمت إزالة السجل المحدد فقط.','success');
    await loadSection(state.section);await loadStats();
  }
  async function saveRecord(e,sec){
    e.preventDefault();say('#sectionMsg','جارٍ الحفظ...');
    const form=new FormData(e.currentTarget),employeeMode=!admin()&&state.role==='employee',data={};
    for(const f of sec.fields){const [name,,type]=f;if(employeeMode&&sec.table==='staff'&&name==='national_id')continue;if(employeeMode&&sec.table==='staff_leaves'&&name==='status')continue;const val=form.get(name);if(val!==null&&String(val).trim()!=='')data[name]=type==='number'?Number(val):String(val).trim();}
    if(sec.table==='attendance'){delete data.student_name;delete data.student_number;}
    if(employeeMode){
      if(!state.staffRecord){say('#sectionMsg','لم يتم ربط حسابك بسجل العاملين.','error');return;}
      if(sec.table==='staff'){
        const {error}=await state.client.from('staff').update(data).eq('auth_user_id',state.user.id);
        if(error){say('#sectionMsg','لم يتم الحفظ: '+error.message,'error');return;}
        say('#sectionMsg','تم تحديث بياناتك بنجاح.','success');await loadSection(state.section);return;
      }
      if(['staff_leaves','training_courses'].includes(sec.table)){data.staff_id=state.staffRecord.id;if(sec.table==='staff_leaves')data.status='قيد المراجعة';}
    }
    const {error}=await state.client.from(sec.table).insert(data);
    if(error){say('#sectionMsg','لم يتم الحفظ: '+error.message,'error');return;}
    e.currentTarget.reset();say('#sectionMsg','تم حفظ السجل بنجاح.','success');await loadSection(state.section);await loadStats();
  }
  init().catch(e=>{console.error(e);showLogin();say('#loginMsg','حدث خطأ في تشغيل المنظومة: '+(e.message||e),'error');});
})();
