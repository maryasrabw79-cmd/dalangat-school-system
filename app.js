(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const cfg = window.SCHOOL_DB_CONFIG || {};
  const state = { client:null, user:null, profile:null, role:'viewer', section:'employees', pendingAction:null, examMode:'year_end', studentResultMode:'year_end', cache:{employees:[],students:[]}, rows:[], staffRecord:null, libraryBooks:[], profileLoadPromise:null };
  const sections = {
    employees:{title:'العاملون',table:'staff',desc:'سجل بيانات العاملين بالمدرسة.',fields:[['full_name','اسم الموظف','text',true],['employee_no','الكود','text'],['national_id','الرقم القومي','text'],['birth_date','تاريخ الميلاد','date'],['qualification','المؤهل','text'],['hire_date','تاريخ التعيين','date'],['work_start_date','تاريخ استلام العمل','date'],['specialization','التخصص','text'],['job_title','المسمى الوظيفي','text'],['grade','الدرجة','text'],['grade_date','تاريخ الدرجة','date'],['phone','رقم التليفون','tel'],['marital_status','الحالة الاجتماعية','select',false,['أعزب','متزوج','مطلق','أرمل']],['address','العنوان','textarea']],columns:[['full_name','اسم الموظف'],['employee_no','الكود'],['national_id','الرقم القومي'],['birth_date','تاريخ الميلاد'],['qualification','المؤهل'],['hire_date','تاريخ التعيين'],['work_start_date','تاريخ استلام العمل'],['specialization','التخصص'],['job_title','المسمى الوظيفي'],['grade','الدرجة'],['grade_date','تاريخ الدرجة'],['phone','رقم التليفون'],['marital_status','الحالة الاجتماعية'],['address','العنوان']]},
    students:{title:'القبول والتسجيل',table:'students',desc:'إدارة بيانات الطالبات واستمارات الصف الثالث. يُستخرج تاريخ الميلاد والسن في أول أكتوبر من الرقم القومي، ويُستخرج اسم الأب مبدئيًا من الاسم.',fields:[['full_name','اسم الطالبة بالكامل','text',true],['national_id','الرقم القومي (14 رقمًا)','text',true],['father_name','اسم الأب (مستخرج من الاسم ويمكن مراجعته)','text'],['birth_date','تاريخ الميلاد (مستخرج من الرقم القومي)','date'],['academic_year','العام الدراسي','select',true,['2025/2026','2026/2027','2027/2028','2028/2029','2029/2030']],['age_at_october','السن في أول أكتوبر','text'],['total_score','المجموع','number',true],['preparatory_school','المدرسة الإعدادية','text',true],['guardian_job','وظيفة ولي الأمر','text',true],['guardian_phone','تليفون ولي الأمر','tel',true],['address','العنوان','textarea',true]],columns:[['full_name','اسم الطالبة'],['father_name','اسم الأب'],['national_id','الرقم القومي'],['birth_date','تاريخ الميلاد'],['age_at_october','السن في أول أكتوبر'],['total_score','المجموع'],['preparatory_school','المدرسة الإعدادية'],['guardian_job','وظيفة ولي الأمر'],['guardian_phone','تليفون ولي الأمر'],['address','العنوان'],['academic_year','العام الدراسي'],['specialization','التخصص'],['section','الفصل']]},
    attendance:{title:'الحضور والغياب',table:'attendance',desc:'تسجيل حضور الطالبات أو غيابهن.',fields:[['student_id','الطالبة','select',true,'students'],['attendance_date','التاريخ','date',true],['status','الحالة','select',true,['حضور','غياب','تأخير','إذن']],['notes','ملاحظات','textarea']],columns:[['student_name','الطالبة'],['attendance_date','التاريخ'],['status','الحالة'],['notes','ملاحظات']]},
    leaves:{title:'الإجازات',table:'staff_leaves',desc:'تسجيل ومتابعة إجازات العاملين.',fields:[['staff_id','العامل','select',true,'staff'],['leave_type','نوع الإجازة','select',true,['اعتيادية','عارضة','مرضية','بدون مرتب','أخرى']],['start_date','من تاريخ','date',true],['end_date','إلى تاريخ','date',true],['status','حالة الطلب','select',true,['قيد المراجعة','مقبولة','مرفوضة']],['notes','ملاحظات','textarea']],columns:[['staff_name','العامل'],['leave_type','نوع الإجازة'],['start_date','من'],['end_date','إلى'],['status','الحالة'],['notes','ملاحظات']]},
    training_courses:{title:'التدريب',table:'training_courses',desc:'إدارة الدورات التدريبية ومتابعتها.',fields:[['staff_id','العامل/المتدرب','select',true,'staff'],['course_name','اسم الدورة','text',true],['provider','الجهة المنظمة','text'],['start_date','تاريخ البداية','date'],['end_date','تاريخ النهاية','date'],['hours','عدد الساعات','number'],['certificate_no','رقم الشهادة','text'],['notes','ملاحظات','textarea']],columns:[['staff_name','العامل/المتدرب'],['course_name','الدورة'],['provider','الجهة المنظمة'],['start_date','البداية'],['end_date','النهاية'],['hours','الساعات']]},
    staff_schedules:{title:'الجداول',table:'staff_schedules',desc:'إدارة الجداول المدرسية والحصص.',fields:[['staff_id','المعلم/المعلمة','select',true,'staff'],['day_of_week','اليوم','select',true,['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس']],['period_no','رقم الحصة','number',true],['subject_or_task','المادة / المهمة','text',true],['class_or_location','الفصل / المكان','text'],['academic_year','العام الدراسي','text']],columns:[['staff_name','المعلم/المعلمة'],['day_of_week','اليوم'],['period_no','الحصة'],['subject_or_task','المادة / المهمة'],['class_or_location','الفصل / المكان'],['academic_year','العام الدراسي']]}
  };
  const admin = () => state.role === 'admin';
  const say = (id,msg,type='') => { const el=$(id); if(el){el.textContent=msg;el.className='message '+type;} };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const humanRole = r => ({admin:'مدير النظام',manager:'إدارة المدرسة',principal:'مدير المدرسة',viewer:'عرض فقط',employee:'موظف',pending:'بانتظار موافقة المدير'})[r] || r;
  function removeResultsSummaryButton(){
    const removeMatchingButtons = () => {
      document.querySelectorAll('button, a, [role="button"]').forEach(el => {
        const label = (el.innerText || el.textContent || '').replace(/\\s+/g,' ').trim();
        if (/شيت/.test(label) && /ملخص النتائج/.test(label) && !/مواد الدور الثاني/.test(label)) el.remove();
      });
    };
    removeMatchingButtons();
    if (!window.__removeResultsSummaryObserver) {
      window.__removeResultsSummaryObserver = new MutationObserver(removeMatchingButtons);
      window.__removeResultsSummaryObserver.observe(document.body, {childList:true,subtree:true});
    }
  }
  async function init(){
    removeResultsSummaryButton();
    if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey || cfg.supabaseUrl.includes('YOUR-PROJECT')){
      showLogin(); say('#loginMsg','إعدادات Supabase غير مكتملة. راجع ملف config.js.','error'); return;
    }
    state.client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    $('#loginForm').addEventListener('submit',login); $('#studentResultsLoginForm').addEventListener('submit',submitStudentExamLogin); $('#studentExamBackBtn').addEventListener('click',showHome); $('#studentCertificateBackBtn').addEventListener('click',showHome); $('#studentCertificatePrintBtn').addEventListener('click',()=>window.print()); $('#registerForm').addEventListener('submit',activateAccount); $('#showRegisterBtn').addEventListener('click',showRegister); $('#backToLoginBtn').addEventListener('click',showLogin); $('#logoutBtn').addEventListener('click',logout); $('#refreshBtn').addEventListener('click',()=>loadSection(state.section)); $('#homeBtn').addEventListener('click',showHome); $('#exportSelectedBtn').addEventListener('click',()=>exportReportsToExcel($('#exportSectionSelect').value));
    $('#libraryUploadForm').addEventListener('submit',uploadLibraryBook);
    $('#thirdGradeFormsView').addEventListener('click',async(e)=>{
      const report=e.target.closest('[data-third-grade-report]');
      if(report){
        if(report.dataset.thirdGradeReport==='كشف 12'){await printThirdGradeForm12();}
        else say('#thirdGradeFormsMsg','هذا الكشف لم يُنفذ بعد. كشف 12 هو الكشف المجهز حاليًا.','success');
        return;
      }
      if(e.target.closest('#thirdGradeSourceUploadBtn')){
        const file=$('#thirdGradeSourceFile').files?.[0];
        if(!file){say('#thirdGradeFormsMsg','اختر شيت البيانات الأساسي أولًا.','error');return;}
        say('#thirdGradeFormsMsg','تم اختيار الملف «'+file.name+'». استيراد الملف وحفظه في قاعدة البيانات لم يُفعّل بعد؛ كشف 12 يسحب حاليًا من بيانات الطالبات المسجلة بالمنظومة.','success');
      }
    });
    $('#libraryRefreshBtn').addEventListener('click',loadLibraryBooks);
    $('#librarySearch').addEventListener('input',renderLibraryBooks);
    $('#libraryGradeFilter').addEventListener('change',renderLibraryBooks);
    $('#libraryCloseReaderBtn').addEventListener('click',closeLibraryReader);
    $('#libraryBooksList').addEventListener('click',handleLibraryBookAction);
    $('#homeTabs').querySelectorAll('[data-home-section]').forEach(b=>{b.addEventListener('click',async(e)=>{e.preventDefault();const key=b.dataset.homeSection;try{await openHomeSelection(key);}catch(err){console.error('Home tile error ('+key+'):',err);window.alert('تعذر فتح القسم. حدّث الصفحة، وإذا استمرت المشكلة أرسل لي نص الخطأ: '+(err?.message||String(err)));}});});
    $('#homeBtn').addEventListener('click',()=>{if($('#thirdGradeFormsView')&&!$('#thirdGradeFormsView').classList.contains('hidden'))$('#thirdGradeFormsView').classList.add('hidden');});
    state.client.auth.onAuthStateChange((_event,session)=>{ if(session?.user){ state.user=session.user; setTimeout(loadProfile,0); } else { state.user=null; state.profile=null; showLogin(); }});
    const {data:{session}}=await state.client.auth.getSession(); if(session?.user){state.user=session.user;await loadProfile();} else showHome();
  }
  function showHome(){ $('#supportView').classList.add('hidden'); if($('#libraryView'))$('#libraryView').classList.add('hidden'); closeLibraryReader(); hideStudentResultViews(); $('#homeView').classList.remove('hidden'); $('#loginView').classList.add('hidden'); $('#registerView').classList.add('hidden'); $('#appView').classList.add('hidden'); $('#logoutBtn').classList.toggle('hidden',!state.user); $('#homeBtn').classList.remove('hidden'); }
  function showLogin(){ document.querySelectorAll('#homeTabs [data-home-section="students"], #homeTabs [data-home-section="third_grade_forms"]').forEach(tile=>tile.classList.add('hidden')); hideStudentResultViews(); $('#homeView').classList.add('hidden'); $('#registerView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden'); $('#logoutBtn').classList.add('hidden'); $('#homeBtn').classList.remove('hidden'); }
  function showRegister(){ hideStudentResultViews(); $('#homeView').classList.add('hidden'); $('#loginView').classList.add('hidden'); $('#registerView').classList.remove('hidden'); $('#appView').classList.add('hidden'); $('#logoutBtn').classList.add('hidden'); $('#homeBtn').classList.remove('hidden'); say('#registerMsg',''); }
  function hideStudentResultViews(){ $('#studentResultsLoginView').classList.add('hidden'); $('#studentCertificateView').classList.add('hidden'); }
  function showStudentResultsLogin(mode='year_end'){
    state.studentResultMode=mode==='half_year'?'half_year':'year_end';
    $('#studentResultsLoginView h2').textContent=state.studentResultMode==='half_year'?'نتيجة نصف العام':'نتيجة آخر العام';
    $('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#registerView').classList.add('hidden');$('#appView').classList.add('hidden');hideStudentResultViews();
    $('#studentResultsLoginView').classList.remove('hidden');$('#logoutBtn').classList.add('hidden');$('#homeBtn').classList.remove('hidden');
    $('#studentExamNationalId').value='';$('#studentExamAccessCode').value='';say('#studentExamLoginMsg','');
  }
  async function submitStudentExamLogin(e){
    e.preventDefault();
    const btn=$('#studentResultsLoginForm button[type="submit"]');
    const nationalId=$('#studentExamNationalId').value.trim().replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    const accessCode=$('#studentExamAccessCode').value.trim().replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    if(!/^\d{14}$/.test(nationalId)||!/^\d{6,8}$/.test(accessCode)){say('#studentExamLoginMsg','أدخلي رقمًا قوميًا من 14 رقمًا ورمز دخول من 6 أو 8 أرقام.','error');return;}
    btn.disabled=true;btn.textContent='جارٍ التحقق...';say('#studentExamLoginMsg','جارٍ التحقق من بيانات الدخول...');
    try{
      const response=await callAccessFunction({action:'student_exam_login',result_type:state.studentResultMode,national_id:nationalId,access_code:accessCode});
      if(!response?.certificate)throw new Error('تعذر تحميل الشهادة.');
      if(state.studentResultMode==='half_year'){
        const gradeValue=String(response.certificate.grade??response.certificate.class_name??'').trim();
        const gradeKey=examHeader(gradeValue);
        if(gradeKey && !/(?:الصف)?(?:الاول|الثاني)|^1$|^2$|^grade[12]$/.test(gradeKey)) throw new Error('شهادة نصف العام متاحة للصفين الأول والثاني فقط.');
      }
      renderStudentCertificate(response.certificate,response.uses_remaining);
      $('#studentResultsLoginView').classList.add('hidden');$('#studentCertificateView').classList.remove('hidden');$('#studentCertificateView').style.display='block';$('#studentCertificateHost').style.display='block';$('#homeView').classList.add('hidden');$('#appView').classList.add('hidden');$('#homeBtn').classList.remove('hidden');
    }catch(err){say('#studentExamLoginMsg',err?.message||'تعذر تسجيل الدخول. تأكدي من البيانات وحاولي مرة أخرى.','error');}
    finally{btn.disabled=false;btn.textContent='عرض الشهادة';}
  }
  function renderStudentCertificate(r,remaining){
    const nonSubjectHeader=/^(?:رقم الجلوس|رقم جلوس|جلوس|seat(?: number|_no|_number)?|national id|الرقم القومي|اسم الطالبة|اسم الطالب|اسم التلميذة|الاسم|الصف|الصف الدراسي|الفصل|التخصص|المجموع|النهاية العظمى|النسبة المئوية|النسبة|النتيجة|مواد الرسوب|مواد الدور الثاني|العام الدراسي|الدور|رئيس الكنترول|اسم رئيس الكنترول|مدير المدرسة|اسم المدير|اسم مدير المدرسة|مسلسل|الديانة|مجموع الطالبة|الدرجة النهائية|الدرجة الكلية)$/i;
    const rawSubjects=r.subjects&&typeof r.subjects==='object'?Object.entries(r.subjects).filter(([name])=>!nonSubjectHeader.test(String(name).trim())):[];
    const subjectOrder=['لغة عربية','اللغة العربية','عربي','لغة إنجليزية','اللغة الإنجليزية','انجليزي','إنجليزي','رياضيات','الرياضيات','فيزياء','الفيزياء','كيمياء','الكيمياء','دراسات اجتماعية','الدراسات الاجتماعية','حاسب آلي','الحاسب الآلي','الوحدة الأولى','الوحدة الاولى','الوحدة 1','الوحدة الثانية','الوحدة 2','الوحدة الثالثة','الوحدة الثالثه','الوحدة 3','الوحدة الرابعة','الوحدة الرابعه','الوحدة 4','الوحدة الخامسة','الوحدة الخامسه','الوحدة 5','الوحدة السادسة','الوحدة السادسه','الوحدة 6','الوحدة السابعة','الوحدة السابعه','الوحدة 7','الوحدة الثامنة','الوحدة الثامنه','الوحدة 8','الوحدة التاسعة','الوحدة التاسعه','الوحدة 9','تربية دينية','التربية الدينية','تربية دينيه','التربية الدينيه','تربية قومية','التربية القومية','تربيه قوميه','التربيه القوميه'];
    const orderIndex=name=>{const n=examHeader(name);const i=subjectOrder.findIndex(s=>examHeader(s)===n);return i<0?999:i;};
    const subjects=rawSubjects;
    const escText=v=>esc(v===null||v===undefined||String(v).trim()===''?'—':v);
    const failedRaw=r.failed_subjects??r.subjects_failed??r.failing_subjects??r.second_round_subjects??r.materials_second_round??r['مواد الدور الثاني']??'';
    const failedList=Array.isArray(failedRaw)?failedRaw.join('، '):String(failedRaw||'').trim();
    const subjectRows=subjects.length?subjects.map(([name,mark])=>'<tr><td>'+esc(name)+'</td><td>'+escText(r.subject_max_marks&&typeof r.subject_max_marks==='object'?(r.subject_max_marks[name]??'—'):'—')+'</td><td>'+escText(mark)+'</td></tr>').join(''):'<tr><td colspan="3">لا توجد مواد مسجلة</td></tr>';
    const seatNo=[r.seat_number,r.seat_no,r.seating_number,r.exam_seat_number,r.seating_no,r.seatNumber,r.exam_seat].find(v=>v!==null&&v!==undefined&&String(v).trim()!=='')??'غير مسجل';
    const specialization=String(r.specialization??r.department??r.trade??r.program??r.specialty??'').trim();
    const meta=[['اسم الطالبة',r.full_name],['الرقم القومي',r.national_id],['رقم الجلوس',seatNo],['الصف',r.grade],['الفصل',r.section],['التخصص',specialization],['العام الدراسي',r.academic_year],['الدور',r.exam_round]].filter(x=>x[1]!==null&&x[1]!==undefined&&String(x[1]).trim()!=='');
    const gradeText=String(r.grade??'').trim();

    const status=String(r.result_status??r.status??'غير محددة').trim()||'غير محددة';
    const summary=[['المجموع',r.total],['النهاية العظمى',r.max_total],['النسبة المئوية',r.percentage===null||r.percentage===undefined?'':String(r.percentage)+'%']].filter(x=>x[1]!==null&&x[1]!==undefined&&String(x[1]).trim()!=='');
    const statusNorm=examHeader(status);
    const isSecondRound=/دور\s*ثان|دور\s*ثاني|الدور\s*الثاني|تخلف|إعادة/.test(statusNorm)||Boolean(failedList);
    const metaHtml=meta.map(([k,v])=>'<div><strong>'+esc(k)+':</strong> '+esc(v)+'</div>').join('');
    const summaryHtml=summary.length?'<div class="certificate-summary">'+summary.map(([k,v])=>'<div><strong>'+esc(k)+':</strong> '+esc(v)+'</div>').join('')+'</div>':'';
    const principalName=String(r.principal_name??r.school_principal??r.principal??r.manager_name??r['مدير المدرسة']??r['اسم المدير']??r['اسم مدير المدرسة']??'').trim();
    const controllerName=String(r.controller_name??r.head_controller??r.exam_controller??r.chief_controller??r.committee_head??r['رئيس الكنترول']??r['اسم رئيس الكنترول']??r['رئيس لجنة الكنترول']??r['اسم رئيس لجنة الكنترول']??'').trim();
    const footerHtml='<p class="congrats-promotion">مع أطيب الأمنيات بدوام التقدم والنجاح</p><footer class="certificate-footer"><span class="principal-signature"><strong>مدير المدرسة</strong><span class="signature-name">'+esc(principalName||'')+'</span></span><span class="controller-signature"><strong>رئيس الكنترول</strong><span class="signature-name">'+esc(controllerName||'')+'</span></span></footer>';
    if(state.studentResultMode==='half_year'){
      const halfGradeKey=examHeader(gradeText);
      const isSecondGrade=/(?:الصف)?الثاني|^2$|^grade2$/.test(halfGradeKey);
      const halfGradeLabel=isSecondGrade?'الثاني':'الأول';
      const serialNo=[r.serial,r.serial_number,r.sequence,r['مسلسل']].find(v=>v!==null&&v!==undefined&&String(v).trim()!=='')??'';
      const halfMeta=[['مسلسل',serialNo],['رقم الجلوس',seatNo],['اسم الطالبة',r.full_name],['الرقم القومي',r.national_id],['الديانة',r.religion],['الصف',halfGradeLabel],['التخصص',specialization]].filter(x=>x[1]!==null&&x[1]!==undefined&&String(x[1]).trim()!=='');
      const halfMetaHtml=halfMeta.map(([k,v])=>'<div class="half-year-meta-item"><strong>'+esc(k)+':</strong><span>'+esc(v)+'</span></div>').join('');
      // First-semester certificate: exactly 15 columns, including the total.
      // Keep the agreed template order: 7 core subjects, 5 units, total, national education, religion.
      const halfExpected=isSecondGrade?[
        ['اللغة العربية',25],['اللغة الإنجليزية',20],['الرياضيات',25],['الفيزياء',20],
        ['الوحدة الأولى',null],['الوحدة الثانية',null],['الوحدة الثالثة',null],['الوحدة الرابعة',null],
        ['الوحدة الخامسة',null],['المجموع',90],['المواطنة',10],['التربية الدينية',10]
      ]:[
        ['اللغة العربية',25],['اللغة الإنجليزية',20],['الرياضيات',15],['الفيزياء',10],['الكيمياء',10],
        ['الدراسات الاجتماعية',10],['الحاسب الآلي',10],['الوحدة الأولى',null],['الوحدة الثانية',null],
        ['الوحدة الثالثة',null],['الوحدة الرابعة',null],['الوحدة الخامسة',null],['المجموع',100],
        ['التربية القومية',10],['التربية الدينية',10]
      ];
      const normalizedHalfSubjects=new Map(subjects.map(([name,mark])=>[examHeader(name),{name,mark}]));
      const findHalfValue=(label)=>{
        const key=examHeader(label);
        const match=[...normalizedHalfSubjects.entries()].find(([name])=>name===key ||
          (label==='اللغة العربية'&&/عربي/.test(name)) ||
          (label==='اللغة الإنجليزية'&&/انجليزي/.test(name)) ||
          (label==='الرياضيات'&&/رياضيات/.test(name)) ||
          (label==='الفيزياء'&&/فيزياء/.test(name)) ||
          (label==='الكيمياء'&&/كيمياء/.test(name)) ||
          (label==='الحاسب الآلي'&&/حاسب/.test(name)) ||
          (label==='الدراسات الاجتماعية'&&/دراسات/.test(name)) ||
          (label==='التربية القومية'&&/تربيهقوميه/.test(name)) ||
          (label==='التربية الدينية'&&/تربيه دينيه|تربيه ديني/.test(name)) ||
          (/^الوحدة/.test(label)&&name.includes(key)) ||
          (label==='المجموع'&&/مجموع|اجمالي|total/.test(name)));
        if(match)return match[1];
        // Some stored certificate responses return the imported columns at the top level.
        const direct=Object.entries(r||{}).find(([name])=>examHeader(name)===key);
        return direct?{name:direct[0],mark:direct[1]}:null;
      };
      const halfSubjectCells=halfExpected.map(([label,fallbackMax])=>{
        const match=findHalfValue(label);
        const mark=label==='المجموع'
          ? (r.total??r.total_score??r['المجموع']??r['المجموع الكلي']??match?.mark??'')
          : (match?.mark??'');
        const maxMarks=r.subject_max_marks&&typeof r.subject_max_marks==='object'?r.subject_max_marks:{};
        const sourceMax=maxMarks[match?.name||label]??maxMarks[label]??fallbackMax;
        return {name:label,mark,max:sourceMax};
      });
      const halfTables=['<table class="half-year-grade-table"><tbody>'+
        '<tr class="half-year-subject-names"><th class="half-year-row-label">المادة</th>'+halfSubjectCells.map(x=>'<th>'+esc(x.name)+'</th>').join('')+'</tr>'+
        '<tr class="half-year-max-marks"><th class="half-year-row-label">درجة المادة</th>'+halfSubjectCells.map(x=>'<td>'+escText(x.max)+'</td>').join('')+'</tr>'+
        '<tr class="half-year-student-marks"><th class="half-year-row-label">درجة الطالبة</th>'+halfSubjectCells.map(x=>'<td>'+escText(x.mark)+'</td>').join('')+'</tr>'+
        '</tbody></table>'];
      const halfController=controllerName||'';
      const halfPrincipal=principalName||'';
      $('#studentCertificateHost').innerHTML='<article class="student-certificate half-year-certificate" dir="rtl"><div class="half-year-certificate-frame"><div class="half-year-certificate-top"><div>محافظة البحيرة</div><div>مديرية التربية والتعليم بالبحيرة</div><div>إدارة الدلنجات التعليمية</div><h1>مدرسة الدلنجات الصناعية بنات</h1><div class="half-year-title">شهادة نتيجة الفصل الدراسي الأول للصف '+halfGradeLabel+'</div></div><section class="half-year-student-info"><h2>بيانات الطالبة</h2><div class="half-year-meta-grid">'+halfMetaHtml+'</div></section><section class="half-year-grades"><h2>بيان المواد والوحدات ودرجات الطالبة</h2>'+(halfTables.join('')||'<p>لا توجد مواد أو درجات مسجلة في الشيت.</p>')+'</section><footer class="half-year-signatures"><div><strong>رئيس الكنترول</strong><span>'+esc(halfController)+'</span></div><div><strong>مدير المدرسة</strong><span>'+esc(halfPrincipal)+'</span></div></footer><div class="half-year-certificate-bottom">مع أطيب الأمنيات بالتوفيق والنجاح</div></div></article><p class="no-print certificate-usage-note">مرات الدخول المتبقية لهذا الرمز: '+esc(remaining)+' (من أصل 5).</p>';
    }else if(isSecondRound){
      const failedSubjects=failedList||'يرجى مراجعة المدرسة لمعرفة المواد المطلوبة';
      $('#studentCertificateHost').innerHTML='<article class="student-certificate congrats-certificate second-round-certificate" dir="rtl"><div class="certificate-ornament"><div class="congrats-top"><span class="congrats-star">✦</span><span>محافظة البحيرة</span><span class="congrats-star">✦</span></div><header class="certificate-header"><div class="certificate-ministry">مديرية التربية والتعليم بالبحيرة</div><div class="certificate-administration">إدارة الدلنجات التعليمية</div><h1>مدرسة الدلنجات الصناعية بنات</h1><div class="congrats-ribbon">إشعار بوجود دور ثانٍ</div></header><p class="congrats-message">تُخطر إدارة مدرسة الدلنجات الصناعية بنات الطالبة الموضح اسمها أدناه بأن نتيجة امتحانات النقل أسفرت عن استحقاقها دخول امتحانات الدور الثاني، وفقًا للمواد الموضحة بهذا الإشعار.</p><div class="congrats-student-name">'+esc(r.full_name||'الطالبة')+'</div><div class="congrats-details"><span><strong>العام الدراسي:</strong> '+esc(r.academic_year||'—')+'</span><span><strong>رقم الجلوس:</strong> '+esc(seatNo)+'</span><span><strong>الصف:</strong> '+esc(gradeText||'—')+'</span></div><section class="second-round-subject-box"><h2>مواد الدور الثاني</h2><div class="second-round-subjects">'+esc(failedSubjects)+'</div></section>'+(r.total!==null&&r.total!==undefined&&String(r.total).trim()!==''?'<div class="second-round-total">المجموع النهائي: <strong>'+esc(r.total)+'</strong>'+(r.max_total!==null&&r.max_total!==undefined?' من '+esc(r.max_total)+' درجة':'')+'</div>':'')+'<p class="second-round-encouragement">نرجو الاستعداد الجيد لامتحانات الدور الثاني، ونتمنى للطالبة دوام التوفيق والنجاح.</p><footer class="certificate-footer"><span class="principal-signature"><strong>مدير المدرسة</strong><span class="signature-name">'+esc(principalName||'')+'</span></span><span class="controller-signature"><strong>رئيس الكنترول</strong><span class="signature-name">'+esc(controllerName||'')+'</span></span></footer></div></article><p class="no-print certificate-usage-note">مرات الدخول المتبقية لهذا الرمز: '+esc(remaining)+' (من أصل 5).</p>';
    }else{
      const totalText=r.total!==null&&r.total!==undefined&&String(r.total).trim()!==''?String(r.total):'—';
      const maxTotalText=r.max_total!==null&&r.max_total!==undefined&&String(r.max_total).trim()!==''?String(r.max_total):'—';
      $('#studentCertificateHost').innerHTML='<article class="student-certificate congrats-certificate" dir="rtl"><div class="certificate-ornament"><div class="congrats-top"><span class="congrats-star">✦</span><span>محافظة البحيرة</span><span class="congrats-star">✦</span></div><header class="certificate-header"><div class="certificate-ministry">مديرية التربية والتعليم بالبحيرة</div><div class="certificate-administration">إدارة الدلنجات التعليمية</div><h1>مدرسة الدلنجات الصناعية بنات</h1><div class="congrats-ribbon">شهادة تهنئة بالنجاح</div></header><p class="congrats-message">تتقدم إدارة المدرسة بخالص التهنئة للطالبة</p><div class="congrats-student-name">'+esc(r.full_name||'الطالبة')+'</div><div class="congrats-details"><span><strong>العام الدراسي:</strong> '+esc(r.academic_year||'—')+'</span><span><strong>الصف:</strong> '+esc(gradeText||'—')+'</span><span><strong>رقم الجلوس:</strong> '+esc(seatNo)+'</span><span><strong>الدور / الفصل:</strong> '+esc(r.exam_round||'الدور الأول')+'</span></div><div class="congrats-total-panel"><span>المجموع النهائي</span><strong>'+esc(totalText)+'</strong><small>من '+esc(maxTotalText)+' درجة</small></div><section class="certificate-result"><strong>النتيجة النهائية: '+esc(status==='غير محددة'?'ناجحة':status)+'</strong></section>'+footerHtml+'</div></article><p class="no-print certificate-usage-note">مرات الدخول المتبقية لهذا الرمز: '+esc(remaining)+' (من أصل 5).</p>';
    }
  }
  async function openStudentResultHome(){showHome();}
  function showSupport(){ hideStudentResultViews(); $('#homeView').classList.add('hidden'); $('#loginView').classList.add('hidden'); $('#registerView').classList.add('hidden'); $('#appView').classList.add('hidden'); $('#supportView').classList.remove('hidden'); $('#logoutBtn').classList.toggle('hidden',!state.user); $('#homeBtn').classList.remove('hidden'); }
  async function openHomeSelection(key){
    if($('#thirdGradeFormsView'))$('#thirdGradeFormsView').classList.add('hidden');
    if(key==='support'){showSupport();return;}
    if(key==='library'){
      if(!state.user||!state.profile){state.pendingAction='library';showLogin();return;}
      await openLibrary();return;
    }
    if(key==='half_year_results'){if(admin()){await openExamResults('half_year');}else{showStudentResultsLogin('half_year');}return;}
    if(key==='exam_results'){if(admin()){await openExamResults('year_end');}else{showStudentResultsLogin('year_end');}return;}
    if(key==='export'&&state.user&&!admin()){say('#sectionMsg','استخراج ملفات Excel متاح لمدير النظام فقط.','error');return;}
    if(key==='home'){showHome();return;}
    if(key==='logout'){if(state.user){await logout();}else{showHome();}return;}
    if(key==='third_grade_forms'){await openThirdGradeForms();return;}
    const implemented=['employees','students','attendance','leaves','training_courses','staff_schedules','users','export'];
    if(!implemented.includes(key)){window.alert('هذا القسم ظاهر في الواجهة الجديدة، لكن وظيفته التفصيلية لم تُبرمج بعد.');return;}
    const action=key==='export'?'export':key;
    if(!state.user||!state.profile){state.pendingAction=action;showLogin();return;}
    if(action==='exam_results'){await openExamResults();return;}
    if(action==='export'){showExportOptions();$('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');return;}
    $('#dataView').classList.remove('exam-admin-view');$('#refreshBtn').classList.remove('hidden');$('#tabs').classList.remove('hidden');
    if(action==='users'&&!admin()){say('#sectionMsg','ليس لديك صلاحية إدارة المستخدمين.','error');return;}
    if(!sections[action]&&action!=='users'&&action!=='national_ids')return;
    if(!allowedSections().includes(action)){say('#sectionMsg','هذا القسم غير متاح لصلاحية حسابك.','error');return;}
    state.section=action;$('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');$('#exportView').classList.add('hidden');$('#dataView').classList.remove('hidden');renderTabs();await loadSection(action);
  }

  async function openThirdGradeForms(){
    if(!state.user||!state.profile){state.pendingAction='third_grade_forms';showLogin();return;}
    if(!admin()){window.alert('استمارات الصف الثالث متاحة لمدير النظام فقط.');showHome();return;}
    $('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#registerView').classList.add('hidden');$('#appView').classList.remove('hidden');
    $('#exportView').classList.add('hidden');$('#dataView').classList.add('hidden');$('#tabs').classList.add('hidden');$('#libraryView').classList.add('hidden');
    $('#thirdGradeFormsView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');$('#homeBtn').classList.remove('hidden');
    say('#thirdGradeFormsMsg','');
  }
  function normalizeDigits(value){return String(value??'').replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));}
  function form12Escape(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  async function printThirdGradeForm12(){
    if(!admin()){say('#thirdGradeFormsMsg','استخراج كشف 12 متاح لمدير النظام فقط.','error');return;}
    const year=Number($('#thirdGradeFormYear').value);
    if(!Number.isInteger(year)||year<1900||year>2200){say('#thirdGradeFormsMsg','أدخل عام الاستمارة بصورة صحيحة.','error');return;}
    const btn=document.querySelector('[data-third-grade-report="كشف 12"]');
    if(btn){btn.disabled=true;btn.textContent='جارٍ تجهيز الكشف...';}
    say('#thirdGradeFormsMsg','جارٍ جلب بيانات الطالبات وتجهيز كشف 12...');
    try{
      const {data,error}=await state.client.from('students').select('*').order('full_name',{ascending:true}).limit(10000);
      if(error)throw error;
      const students=(data||[]).filter(s=>String(s.full_name||s.student_name||'').trim()).sort((a,b)=>String(a.full_name||a.student_name||'').localeCompare(String(b.full_name||b.student_name||''),'ar'));
      if(!students.length)throw new Error('لا توجد طالبات مسجلات في جدول الطالبات.');
      const pages=[];
      for(let i=0;i<students.length;i+=20)pages.push(students.slice(i,i+20));
      const get=(s,keys)=>{for(const k of keys){if(s[k]!==undefined&&s[k]!==null&&String(s[k]).trim()!=='')return s[k];}return '';};
      const ageAtExam=(birth,examYear)=>{
        if(!birth)return '';
        const d=new Date(birth);if(Number.isNaN(d.getTime()))return '';
        let y=examYear-d.getFullYear(),m=4-d.getMonth(),day=1-d.getDate();
        if(day<0){m--;day+=new Date(examYear,4,0).getDate();}
        if(m<0){y--;m+=12;}
        return y>=0?y+' سنة / '+m+' شهر / '+day+' يوم':'';
      };
      const cell=(v)=>'<td>'+form12Escape(v)+'</td>';
      const sheets=pages.map((page,pageIndex)=>{
        const rows=page.map((s,j)=>{
          const id=normalizeDigits(get(s,['national_id','national_number','national_id_number']));
          const d=deriveThirdGradeStudent(id,get(s,['full_name','student_name']),year);
          const birth=get(s,['birth_date','date_of_birth'])||d.birthDate;
          const birthText=birth?(String(birth).includes('-')?String(birth).split('T')[0]:birth):'';
          const name=get(s,['full_name','student_name']);
          const father=get(s,['father_name','guardian_name','parent_name'])||d.fatherName;
          return '<tr>'+cell(pageIndex*20+j+1)+cell(get(s,['student_code','student_no','code']))+cell(name)+cell(get(s,['religion','religious_affiliation']))+cell(birthText)+cell(get(s,['birth_governorate','birth_place','governorate'])||d.governorate)+cell(ageAtExam(birthText,year)||([d.ageYears,d.ageMonths,d.ageDays].some(x=>x!=='')?[d.ageYears+' سنة / '+d.ageMonths+' شهر / '+d.ageDays+' يوم']:'') )+cell(id)+cell(father)+cell(get(s,['father_occupation','guardian_job','parent_job']))+cell(get(s,['guardian_address','address','home_address']))+cell(get(s,['guardian_phone','mobile','phone']))+'</tr>';
        }).join('');
        const blanks=Array.from({length:20-page.length},(_,j)=>'<tr>'+Array.from({length:12},()=>'<td>&nbsp;</td>').join('')+'</tr>').join('');
        return '<section class="sheet"><div class="heading"><div>وزارة التربية والتعليم</div><div>امتحان دبلوم المدارس الثانوية الفنية الصناعية نظام الثلاث سنوات لعام '+year+' م</div><strong>كشف 12 امتحانات (ثانوي صناعي)</strong><div class="subheading">الإدارة العامة للامتحانات</div><div>كشف بأسماء الطالبات المتقدمات للامتحان من تخصص: ....................</div><div>كشف رقم ( '+(pageIndex+1)+' )</div><div class="school">مدرسة الدلنجات الصناعية بنات — مديرية / إدارة الدلنجات التعليمية بمحافظة البحيرة</div><div>(جميع الطالبات مصريات الجنسية ويدرسن اللغة الإنجليزية)</div></div><table><thead><tr><th>م</th><th>كود</th><th>اسم الطالبة</th><th>الديانة</th><th>تاريخ الميلاد</th><th>محل الميلاد (المحافظة)</th><th>السن في تاريخ الامتحان</th><th>الرقم القومي</th><th>اسم والد الطالبة</th><th>صناعته</th><th>عنوان ولي الأمر</th><th>رقم التليفون</th></tr></thead><tbody>'+rows+blanks+'</tbody></table><div class="footerline"><span>تم تحرير الكشوف من واقع ملفات الطلاب بالمدرسة وبعد التأكد من قانونية تقدم الطلبة للامتحان،،</span><span class="seal">خاتم شعار الجمهورية</span></div><div class="bottomline"><span><b>تنبيهات عامة:</b> 1- تكتب الأسماء بالكشوف مرتبة هجائيًا ولكل صناعة على حدة ولكل فئة على حدة (منتظمون – عمال – منازل).</span><span class="approval">يعتمد،،<br>مدير المدرسة</span></div><div class="page-count">كشف '+(pageIndex+1)+' من '+pages.length+'</div></section>';
      }).join('');
      const win=window.open('','_blank');
      if(!win)throw new Error('المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة للمنظومة ثم أعد المحاولة.');
      win.document.open();
      win.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>كشف 12 - '+year+'</title><style>@page{size:A4 landscape;margin:7mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#111;margin:0}.sheet{border:4px double #111;padding:4mm;min-height:190mm;page-break-after:always;position:relative}.sheet:last-child{page-break-after:auto}.heading{text-align:center;line-height:1.45;font-size:10pt}.heading strong{display:block;font-size:14pt;margin:1mm 0}.subheading{font-weight:bold}.school{font-weight:bold;margin-top:1mm}table{border-collapse:collapse;width:100%;table-layout:fixed;margin-top:3mm;font-size:7.2pt}th,td{border:1px solid #333;text-align:center;padding:1.2mm .5mm;overflow-wrap:anywhere;height:6.3mm}th{font-weight:bold;background:#f2f2f2}th:nth-child(1){width:3%}th:nth-child(2){width:5%}th:nth-child(3){width:12%}th:nth-child(4){width:4%}th:nth-child(5){width:7%}th:nth-child(6){width:8%}th:nth-child(7){width:9%}th:nth-child(8){width:10%}th:nth-child(9){width:10%}th:nth-child(10){width:8%}th:nth-child(11){width:13%}th:nth-child(12){width:11%}.footerline{display:flex;justify-content:space-between;align-items:center;font-size:8pt;margin-top:3mm;gap:8mm}.seal{font-weight:bold;white-space:nowrap}.bottomline{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;font-size:8pt;margin-top:3mm}.approval{text-align:center;min-width:30mm;font-weight:bold;white-space:nowrap}.page-count{position:absolute;bottom:1mm;left:4mm;font-size:7pt;color:#555}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>'+sheets+'</body></html>');
      win.document.close();
      win.focus();
      setTimeout(()=>{try{win.print();}catch(e){}},600);
      say('#thirdGradeFormsMsg','تم تجهيز كشف 12 للطباعة: '+students.length+' طالبة في '+pages.length+' كشف، بواقع 20 طالبة في الكشف الواحد. البيانات غير المسجلة في ملفات الطالبات ستظهر فارغة.','success');
    }catch(err){say('#thirdGradeFormsMsg','تعذر استخراج كشف 12: '+(err?.message||String(err)),'error');}
    finally{if(btn){btn.disabled=false;btn.textContent='كشف 12';}}
  }

  function deriveThirdGradeStudent(nationalId,fullName,formYear){
    const id=normalizeDigits(nationalId).trim();
    let birthDate='',governorate='';
    if(/^\\d{14}$/.test(id)){
      const century=id[0]==='2'?1900:id[0]==='3'?2000:0;
      const year=century+Number(id.slice(1,3)),month=Number(id.slice(3,5)),day=Number(id.slice(5,7));
      const date=new Date(year,month-1,day);
      if(century&&date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day){
        birthDate=year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      }
      const code=id.slice(7,9);
      const governorates={'01':'القاهرة','02':'الإسكندرية','03':'بورسعيد','04':'السويس','11':'دمياط','12':'الدقهلية','13':'الشرقية','14':'القليوبية','15':'كفر الشيخ','16':'الغربية','17':'المنوفية','18':'البحيرة','19':'الإسماعيلية','21':'الجيزة','22':'بني سويف','23':'الفيوم','24':'المنيا','25':'أسيوط','26':'سوهاج','27':'قنا','28':'أسوان','29':'الأقصر','31':'البحر الأحمر','32':'الوادي الجديد','33':'مطروح','34':'شمال سيناء','35':'جنوب سيناء','88':'خارج الجمهورية'};
      governorate=governorates[code]||'غير محددة';
    }
    const targetYear=Number(formYear);
    let ageYears='',ageMonths='',ageDays='';
    if(birthDate&&Number.isInteger(targetYear)&&targetYear>=1900&&targetYear<=2200){
      const [by,bm,bd]=birthDate.split('-').map(Number);
      const target=new Date(targetYear,4,1);
      const birth=new Date(by,bm-1,bd);
      if(birth<=target){
        let years=targetYear-by, months=5-bm, days=1-bd;
        if(days<0){months--;days+=new Date(targetYear,4,0).getDate();}
        if(months<0){years--;months+=12;}
        ageYears=years;ageMonths=months;ageDays=days;
      }
    }
    const parts=String(fullName||'').trim().split(/\\s+/).filter(Boolean);
    const fatherName=parts.length>=2?parts.slice(1).join(' '):'';
    const [birthYear,birthMonth,birthDay]=birthDate?birthDate.split('-'):[ '', '', '' ];
    return {birthDate,birthYear,birthMonth,birthDay,governorate,ageYears,ageMonths,ageDays,fatherName};
  }
  async function downloadThirdGradeFormsSheet(){
    if(!admin()){say('#thirdGradeFormsMsg','تنزيل الشيت متاح لمدير النظام فقط.','error');return;}
    if(typeof XLSX==='undefined'){say('#thirdGradeFormsMsg','مكتبة Excel غير متاحة؛ حدّث الصفحة وحاول مرة أخرى.','error');return;}
    const formYear=Number($('#thirdGradeFormYear').value);
    if(!Number.isInteger(formYear)||formYear<1900||formYear>2200){say('#thirdGradeFormsMsg','أدخل سنة الاستمارة بشكل صحيح.','error');return;}
    const btn=$('#thirdGradeDownloadBtn');btn.disabled=true;btn.textContent='جارٍ تجهيز الشيت...';say('#thirdGradeFormsMsg','جارٍ جلب بيانات الطالبات وتجهيز ملف Excel...');
    try{
      const {data,error}=await state.client.from('students').select('*').order('full_name',{ascending:true}).limit(10000);
      if(error)throw error;
      const rows=(data||[]).map((s,i)=>{
        const d=deriveThirdGradeStudent(s.national_id,s.full_name,formYear);
        return {'مسلسل':i+1,'كود الطالبة':s.student_code||s.student_no||s.code||'','اسم الطالبة':s.full_name||'','الرقم القومي':normalizeDigits(s.national_id||''),'وظيفة الوالد':s.guardian_job||'','العنوان':s.address||'','تليفون محمول':s.guardian_phone||s.mobile||s.phone||'','يوم الميلاد':d.birthDay,'شهر الميلاد':d.birthMonth,'سنة الميلاد':d.birthYear,'محافظة الميلاد':d.governorate,'السن - سنوات':d.ageYears,'السن - شهور':d.ageMonths,'السن - أيام':d.ageDays,'اسم الأب كامل':d.fatherName};
      });
      const ws=XLSX.utils.json_to_sheet(rows,{header:['مسلسل','كود الطالبة','اسم الطالبة','الرقم القومي','وظيفة الوالد','العنوان','تليفون محمول','يوم الميلاد','شهر الميلاد','سنة الميلاد','محافظة الميلاد','السن - سنوات','السن - شهور','السن - أيام','اسم الأب كامل']});
      ws['!views']=[{rightToLeft:true}];ws['!cols']=[{wch:9},{wch:16},{wch:32},{wch:18},{wch:24},{wch:36},{wch:18},{wch:12},{wch:12},{wch:12},{wch:20},{wch:12},{wch:12},{wch:12},{wch:28}];
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'استمارات الصف الثالث');
      XLSX.writeFile(wb,'استمارات_الصف_الثالث_'+formYear+'.xlsx');
      say('#thirdGradeFormsMsg','تم تجهيز الشيت بعدد '+rows.length+' طالبة، مع استخراج البيانات المتاحة من الرقم القومي والاسم.','success');
    }catch(err){say('#thirdGradeFormsMsg','تعذر تجهيز الشيت: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=false;btn.textContent='تحميل شيت إكسل';}
  }
  async function openLibrary(){
    if(!state.user||!state.profile){state.pendingAction='library';showLogin();return;}
    $('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#registerView').classList.add('hidden');$('#appView').classList.remove('hidden');
    $('#exportView').classList.add('hidden');$('#dataView').classList.add('hidden');$('#tabs').classList.add('hidden');$('#libraryView').classList.remove('hidden');
    $('#logoutBtn').classList.remove('hidden');$('#homeBtn').classList.remove('hidden');
    $('#libraryAdminPanel').classList.toggle('hidden',!admin());
    say('#libraryMsg','');say('#libraryAdminMsg','');
    await loadLibraryBooks();
  }
  async function loadLibraryBooks(){
    if(!state.user||!state.client){say('#libraryMsg','يجب تسجيل الدخول لعرض المكتبة.','error');return;}
    $('#libraryBooksList').innerHTML='<p class="library-empty">جارٍ تحميل الكتب...</p>';
    const {data,error}=await state.client.from('library_books').select('id,title,subject,grade,description,storage_path,file_name,created_at').order('created_at',{ascending:false});
    if(error){$('#libraryBooksList').innerHTML='';say('#libraryMsg','تعذر تحميل الكتب: '+error.message,'error');return;}
    state.libraryBooks=data||[];renderLibraryBooks();
  }
  function renderLibraryBooks(){
    const host=$('#libraryBooksList');if(!host)return;
    const books=state.libraryBooks||[];
    const q=String($('#librarySearch')?.value||'').trim().toLocaleLowerCase('ar');
    const grade=$('#libraryGradeFilter')?.value||'';
    const filtered=books.filter(b=>(!grade||b.grade===grade)&&(!q||[b.title,b.subject,b.grade,b.description].some(v=>String(v||'').toLocaleLowerCase('ar').includes(q))));
    if(!filtered.length){host.innerHTML='<p class="library-empty">لا توجد كتب مطابقة حاليًا.</p>';return;}
    host.innerHTML=filtered.map(b=>'<article class="library-book-card"><div class="library-book-icon" aria-hidden="true">📘</div><div class="library-book-info"><h3>'+esc(b.title)+'</h3><p>'+esc(b.subject||'مادة غير محددة')+' · '+esc(b.grade?'الصف '+b.grade:'كل الصفوف')+'</p>'+(b.description?'<p class="library-book-description">'+esc(b.description)+'</p>':'')+'</div><div class="library-book-actions"><button type="button" data-library-action="read" data-book-id="'+esc(b.id)+'">قراءة الكتاب</button>'+(admin()?'<button type="button" class="secondary" data-library-action="delete" data-book-id="'+esc(b.id)+'">حذف</button>':'')+'</div></article>').join('');
  }
  async function uploadLibraryBook(e){
    e.preventDefault();
    if(!admin()){say('#libraryAdminMsg','رفع الكتب متاح للإدارة المخوّلة فقط.','error');return;}
    const file=$('#libraryFile').files?.[0];const title=$('#libraryTitle').value.trim();
    if(!file||!title){say('#libraryAdminMsg','اكتب اسم الكتاب واختر ملف PDF.','error');return;}
    if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){say('#libraryAdminMsg','يرجى اختيار ملف بصيغة PDF فقط.','error');return;}
    if(file.size>50*1024*1024){say('#libraryAdminMsg','حجم الكتاب أكبر من الحد المسموح (50 ميجابايت).','error');return;}
    const btn=$('#libraryUploadBtn');btn.disabled=true;btn.textContent='جارٍ رفع الكتاب...';say('#libraryAdminMsg','يتم رفع الملف وحفظ بيانات الكتاب...');
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120)||'book.pdf';
    const path=crypto.randomUUID()+'-'+safeName;
    try{
      const {error:uploadError}=await state.client.storage.from('school-library').upload(path,file,{contentType:'application/pdf',upsert:false});
      if(uploadError)throw uploadError;
      const {error:insertError}=await state.client.from('library_books').insert({title,subject:$('#librarySubject').value.trim()||null,grade:$('#libraryGrade').value||null,description:$('#libraryDescription').value.trim()||null,storage_path:path,file_name:file.name,uploaded_by:state.user.id});
      if(insertError){await state.client.storage.from('school-library').remove([path]);throw insertError;}
      $('#libraryUploadForm').reset();say('#libraryAdminMsg','تم رفع الكتاب وإضافته إلى المكتبة.','success');await loadLibraryBooks();
    }catch(err){say('#libraryAdminMsg','تعذر رفع الكتاب: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=false;btn.textContent='رفع الكتاب';}
  }
  async function handleLibraryBookAction(e){
    const btn=e.target.closest('button[data-library-action]');if(!btn)return;
    const book=(state.libraryBooks||[]).find(b=>b.id===btn.dataset.bookId);if(!book)return;
    if(btn.dataset.libraryAction==='read'){
      try{
        btn.disabled=true;btn.textContent='جارٍ فتح الكتاب...';
        const {data,error}=await state.client.storage.from('school-library').createSignedUrl(book.storage_path,120);
        if(error)throw error;
        $('#libraryReaderTitle').textContent=book.title;
        $('#libraryPdfFrame').src=data.signedUrl+'#toolbar=0&navpanes=0&scrollbar=1';
        $('#libraryReader').classList.remove('hidden');$('#libraryReader').scrollIntoView({behavior:'smooth',block:'start'});
      }catch(err){say('#libraryMsg','تعذر فتح الكتاب: '+(err?.message||String(err)),'error');}
      finally{btn.disabled=false;btn.textContent='قراءة الكتاب';}
    }else if(btn.dataset.libraryAction==='delete'){
      if(!admin()){say('#libraryMsg','ليس لديك صلاحية حذف الكتب.','error');return;}
      if(!window.confirm('هل تريد حذف الكتاب «'+book.title+'» نهائيًا من المكتبة؟'))return;
      btn.disabled=true;
      try{
        const {error:removeError}=await state.client.storage.from('school-library').remove([book.storage_path]);if(removeError)throw removeError;
        const {error:deleteError}=await state.client.from('library_books').delete().eq('id',book.id);if(deleteError)throw deleteError;
        say('#libraryMsg','تم حذف الكتاب.','success');await loadLibraryBooks();
      }catch(err){say('#libraryMsg','تعذر حذف الكتاب: '+(err?.message||String(err)),'error');}
      finally{btn.disabled=false;}
    }
  }
  function closeLibraryReader(){const frame=$('#libraryPdfFrame');if(frame)frame.src='about:blank';const reader=$('#libraryReader');if(reader)reader.classList.add('hidden');}
  function showExportOptions(){ if(!admin()){ $('#exportView').classList.add('hidden'); $('#dataView').classList.remove('hidden'); say('#sectionMsg','استخراج ملفات Excel متاح لمدير النظام فقط.','error'); return; } $('#exportView').classList.remove('hidden'); $('#dataView').classList.add('hidden'); const select=$('#exportSectionSelect'); const keys=admin()?[...Object.keys(sections),'national_ids','users']:allowedSections().filter(k=>k!=='users'); select.innerHTML=keys.map(k=>`<option value="${esc(k)}">${esc(k==='users'?'إدارة المستخدمين':k==='national_ids'?'إضافة الأرقام القومية المسموح لها بالتسجيل':sections[k]?.title||k)}</option>`).join(''); $('#exportMsg').textContent=''; }
  async function login(e){
    e.preventDefault();
    const button=$('#loginForm button[type="submit"]');
    if(!state.client){say('#loginMsg','لم يتم الاتصال بخدمة تسجيل الدخول. حدّث الصفحة، وإذا استمرت المشكلة أرسل لي نص الرسالة.','error');return;}
    if(button){button.disabled=true;button.textContent='جارٍ التحقق...';}
    say('#loginMsg','جارٍ التحقق من بيانات الدخول...');
    try{
      const loginId=$('#loginNationalId').value.trim(); const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)?loginId.toLowerCase():(/^\d{14}$/.test(loginId)?staffLoginEmail(loginId):''); if(!email){say('#loginMsg','اكتب رقمًا قوميًّا من 14 رقمًا، أو البريد الإلكتروني المعتمد لمدير النظام.','error');return;} const {data,error}=await state.client.auth.signInWithPassword({email,password:$('#loginPassword').value});
      if(error){say('#loginMsg','تعذر الدخول: '+error.message,'error');return;}
      if(data?.user){say('#loginMsg','تم التحقق من الحساب، جارٍ تحميل صلاحياته...','success'); await loadProfile();}
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
    const nationalId=$('#registerNationalId').value.trim(),activationCode=$('#registerActivationCode').value.trim(),password=$('#registerPassword').value,confirm=$('#registerPasswordConfirm').value;
    if(!/^\d{14}$/.test(nationalId)){say('#registerMsg','الرقم القومي يجب أن يتكون من 14 رقمًا.','error');return;}
    if(!/^\d{6}$/.test(activationCode)){say('#registerMsg','أدخل رمز التفعيل الرقمي المكوّن من 6 أرقام كما سلّمته لك الإدارة.','error');return;}
    if(password.length<8){say('#registerMsg','كلمة المرور يجب ألا تقل عن 8 أحرف.','error');return;}
    if(password.length>128){say('#registerMsg','كلمة المرور طويلة جدًا.','error');return;}
    if(password!==confirm){say('#registerMsg','كلمتا المرور غير متطابقتين.','error');return;}
    btn.disabled=true;btn.textContent='جارٍ إنشاء الحساب...';say('#registerMsg','جارٍ التحقق من سجل الموظف وإنشاء الحساب...');
    try{
      await callAccessFunction({action:'activate',national_id:nationalId,activation_code:activationCode,password});
      form.reset();showLogin();$('#loginNationalId').value=nationalId;
      say('#loginMsg','تم إنشاء الحساب. يمكنك الآن الدخول بالرقم القومي وكلمة المرور التي اخترتها.','success');
    }catch(err){console.error('Account activation error:',err);say('#registerMsg','تعذر إنشاء الحساب: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=false;btn.textContent='إنشاء الحساب';}
  }
  async function logout(){
    const button=$('#logoutBtn');
    if(button){button.disabled=true;button.textContent='جارٍ تسجيل الخروج...';}
    try{
      if(state.client?.auth){const {error}=await state.client.auth.signOut();if(error)throw error;}
      state.user=null;state.profile=null;state.role='viewer';state.pendingAction=null;
      hideStudentResultViews();showHome();
      $('#appView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#registerView').classList.add('hidden');
      $('#homeView').classList.remove('hidden');$('#logoutBtn').classList.add('hidden');
    }catch(err){
      console.error('Logout error:',err);
      say('#sectionMsg','تعذر تسجيل الخروج من الخادم: '+(err?.message||String(err)),'error');
    }finally{if(button){button.disabled=false;button.textContent='تسجيل الخروج';}}
  }
  function loadProfile(){
    if(state.profileLoadPromise) return state.profileLoadPromise;
    state.profileLoadPromise=loadProfileImpl().catch(err=>{console.error('Profile loading error:',err);showLogin();say('#loginMsg','تعذر تحميل صلاحيات الحساب: '+(err?.message||String(err)),'error');}).finally(()=>{state.profileLoadPromise=null;});
    return state.profileLoadPromise;
  }
  async function loadProfileImpl(){
    if(!state.user || !state.client) return;
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
    renderTabs(); updateHomeTiles(); await loadStats(); const requested=state.pendingAction; state.pendingAction=null; if(requested==='export'){showExportOptions();return;} if(requested==='exam_results'){await openExamResults();return;} if(requested==='library'){await openLibrary();return;} if(requested&&requested!=='users'&&sections[requested]&&allowedSections().includes(requested))state.section=requested; else if(requested==='users'&&admin())state.section='users'; if(!allowedSections().includes(state.section))state.section=allowedSections()[0]||'employees'; renderTabs(); $('#exportView').classList.add('hidden'); $('#dataView').classList.remove('hidden'); await loadSection(state.section);
  }
  async function openExamResults(mode='year_end'){
    state.examMode=mode==='half_year'?'half_year':'year_end';
    if(!admin()){showHome();window.alert('قسم نتائج الامتحانات متاح لمدير النظام فقط.');return;}
    $('#homeView').classList.add('hidden');$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');
    $('#exportView').classList.add('hidden');$('#dataView').classList.remove('hidden');$('#dataView').classList.add('exam-admin-view');$('#tabs').classList.add('hidden');$('#refreshBtn').classList.add('hidden');
    $('#sectionTitle').textContent=state.examMode==='half_year'?'نتيجة نصف العام':'نتيجة آخر العام';$('#sectionDesc').textContent='نزّل نموذج Excel الذي يحتوي على شيتين للصف الأول والصف الثاني، أدخل الدرجات ثم ارفع الملف نفسه. بعد الحفظ سيصدر ملف رموز الدخول.';
    $('#formHost').innerHTML='<div class="exam-import-panel"><div class="form-grid"><label>العام الدراسي<input id="examAcademicYear" type="text" value="2026/2027" required></label><label>الدور / الفصل الامتحاني<select id="examRound"><option>الدور الأول</option><option>الدور الثاني</option><option>الفصل الدراسي الأول</option><option>الفصل الدراسي الثاني</option><option>امتحان آخر</option></select></label><label>ملف Excel (.xlsx أو .xls)<input id="examExcelFile" type="file" accept=".xlsx,.xls,.csv" required></label></div><p>بعد الحفظ سيُنزَّل ملف Excel منفصل يحتوي على مسلسل واسم الطالبة والرقم القومي ورمز دخول عشوائي صالح لخمس مرات.</p><div class="form-actions"><button id="examTemplateBtn" type="button" class="secondary">'+(state.examMode==='half_year'?'نتيجة الصف الأول والثاني':'تنزيل نموذج Excel')+'</button><button id="examImportBtn" type="button">رفع الشيت وإصدار رموز الدخول</button><button id="examIssueCodesBtn" type="button" class="secondary">إصدار رموز للنتائج المحفوظة</button><button id="examClearPreviousBtn" type="button" class="secondary">مسح الشيتات السابقة</button></div><div id="examImportMsg" class="message" aria-live="polite"></div></div>';
    $('#tableHead').innerHTML='';$('#tableBody').innerHTML='';$('#sectionMsg').textContent='';
    if(state.examMode==='half_year'){$('#examRound').innerHTML='<option>الفصل الدراسي الأول</option>';$('#examRound').value='الفصل الدراسي الأول';}
    $('#examTemplateBtn').addEventListener('click',downloadExamTemplate);$('#examImportBtn').addEventListener('click',importExamWorkbook);$('#examIssueCodesBtn').addEventListener('click',issueExamCodesFromSavedResults);$('#examClearPreviousBtn').addEventListener('click',clearPreviousExamSheets);
  }
  async function clearPreviousExamSheets(){const btn=$('#examClearPreviousBtn'),msg=$('#examImportMsg');if(!admin()){msg.className='message error';msg.textContent='مسح النتائج متاح لمدير النظام فقط.';return;}const year=$('#examAcademicYear').value.trim(),round=$('#examRound').value;if(!year){msg.className='message error';msg.textContent='اكتب العام الدراسي أولًا.';return;}if(!window.confirm('سيتم حذف نتائج ورموز دخول العام '+year+'، '+round+' فقط، ولا يمكن التراجع. هل تريد المتابعة؟'))return;btn.disabled=true;const old=btn.textContent;btn.textContent='جارٍ المسح...';msg.className='message';msg.textContent='جارٍ مسح النتائج السابقة...';try{const {data,error}=await state.client.rpc('admin_clear_exam_results_by_round',{p_academic_year:year,p_exam_round:round});if(error)throw error;msg.className='message success';msg.textContent='تم المسح بنجاح. عدد سجلات النتائج المحذوفة: '+Number(data?.deleted_results||0)+'. يمكنك الآن رفع الشيت الجديد.';}catch(err){msg.className='message error';msg.textContent='تعذر مسح الشيتات السابقة: '+(err?.message||String(err));}finally{btn.disabled=false;btn.textContent=old;}}
  async function issueExamCodesFromSavedResults(){
    const btn=$('#examIssueCodesBtn'),msg=$('#examImportMsg');
    if(!admin()){msg.className='message error';msg.textContent='إصدار رموز الدخول متاح لمدير النظام فقط.';return;}
    const year=$('#examAcademicYear').value.trim(),round=$('#examRound').value;
    if(!year){msg.className='message error';msg.textContent='اكتب العام الدراسي أولًا.';return;}
    btn.disabled=true;const old=btn.textContent;btn.textContent='جارٍ إصدار الرموز...';msg.className='message';msg.textContent='جارٍ إصدار ملف رموز الدخول للنتائج المحفوظة...';
    try{
      const {data:{session}}=await state.client.auth.getSession();
      const issued=await callAccessFunction({action:'issue_exam_codes',result_type:state.examMode,academic_year:year,exam_round:round},session?.access_token||null);
      if(!Array.isArray(issued.codes)||!issued.codes.length)throw new Error('لم يتم إرجاع رموز دخول.');
      const rows=issued.codes.map((r,i)=>({'مسلسل':i+1,'اسم الطالبة':r.full_name,'الرقم القومي':String(r.national_id),'رمز الدخول':String(r.access_code)}));
      const ws=XLSX.utils.json_to_sheet(rows);ws['!views']=[{rightToLeft:true}];ws['!cols']=[{wch:10},{wch:32},{wch:20},{wch:16}];
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'رموز دخول الطالبات');
      XLSX.writeFile(wb,'رموز_دخول_الطالبات_'+year.replace('/','-')+'.xlsx');
      msg.className='message success';msg.textContent='تم إصدار وتنزيل رموز الدخول لعدد '+issued.codes.length+' طالبة. كل رمز صالح لخمس مرات، وتم استبدال الرموز السابقة لهذا العام/الدور.';
    }catch(err){console.error('Issue saved exam access codes error:',err);msg.className='message error';msg.textContent='تعذر إصدار رموز الدخول: '+(err?.message||String(err));}
    finally{btn.disabled=false;btn.textContent=old;}
  }
  function examHeader(value){return String(value??'').trim().toLowerCase().replace(/[أإآ]/g,'ا').replace(/[ى]/g,'ي').replace(/[ؤئ]/g,'ء').replace(/[\s_\-\.\/\\()]+/g,'');}
  function examField(headers,aliases){const wanted=aliases.map(examHeader);return headers.findIndex(h=>{const value=examHeader(h);return value&&wanted.some(a=>value===a||(a.length>=4&&value.includes(a))||(value.length>=5&&a.includes(value)));});}
  function examCell(row,index){return index<0?'':row[index]===undefined||row[index]===null?'':String(row[index]).trim();}
  function examId(value){const digits=v=>String(v??'').replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));if(typeof value==='number'&&Number.isFinite(value))return Number.isInteger(value)&&value>=0?String(value):'';let v=digits(value).trim().replace(/[\u200e\u200f\u061c\u00a0\u200b\u202a-\u202e'’]/g,'').replace(/[٬,]/g,'');if(/^\d+(?:\.\d+)?e[+\-]?\d+$/i.test(v)){const n=Number(v);if(Number.isFinite(n)&&n>=0&&Number.isInteger(n))v=String(n);}if(/^\d+\.0+$/.test(v))v=v.replace(/\.0+$/,'');return v.replace(/[^0-9]/g,'');}
  async function importExamWorkbook(){
    const btn=$('#examImportBtn'),msg=$('#examImportMsg'),file=$('#examExcelFile').files[0],year=$('#examAcademicYear').value.trim(),round=$('#examRound').value;
    if(!admin()){msg.className='message error';msg.textContent='ليس لديك صلاحية استيراد النتائج.';return;}
    if(!file){msg.className='message error';msg.textContent='اختر ملف Excel أولًا.';return;}
    if(!year){msg.className='message error';msg.textContent='اكتب العام الدراسي.';return;}
    if(typeof XLSX==='undefined'){msg.className='message error';msg.textContent='تعذر تحميل قارئ Excel. حدّث الصفحة وحاول مرة أخرى.';return;}
    btn.disabled=true;msg.className='message';msg.textContent='جارٍ قراءة الملف وفحص البيانات...';
    try{
      const book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
      // اجمع بيانات الشيتين (الأول والثاني) مع الحفاظ على عناوين الأعمدة، وحدد الصف من اسم الشيت.
      const sheetGrids=book.SheetNames.map(name=>({name,grid:XLSX.utils.sheet_to_json(book.Sheets[name],{header:1,defval:'',raw:true})})).filter(x=>x.grid.length);
      if(!sheetGrids.length)throw new Error('الملف لا يحتوي على شيتات بيانات.');
      const baseGrid=sheetGrids[0].grid, baseHeaderIndex=baseGrid.findIndex(row=>row.some(v=>/الرقم القومي|national.?id/i.test(String(v??'')))&&row.some(v=>/اسم الطالبة|اسم الطالب|full.?name|student.?name/i.test(String(v??''))));
      const grid=baseGrid.map(row=>row.slice());
      const baseHeaders=baseHeaderIndex>=0?baseGrid[baseHeaderIndex].map(v=>String(v??'').trim()):[];
      const baseGradeIndex=baseHeaders.findIndex(v=>/^(الصف|الصف الدراسي|grade)$/i.test(v));
      if(baseGradeIndex>=0&&baseHeaderIndex>=0){const defaultGrade=/الثاني|second|grade\s*2/i.test(sheetGrids[0].name)?'الثاني':'الأول';for(let ri=baseHeaderIndex+1;ri<grid.length;ri++)if(!String(grid[ri][baseGradeIndex]??'').trim()&&grid[ri].some(v=>String(v??'').trim()))grid[ri][baseGradeIndex]=defaultGrade;}
      for(const item of sheetGrids.slice(1)){
        const hi=item.grid.findIndex(row=>row.some(v=>/الرقم القومي|national.?id/i.test(String(v??'')))&&row.some(v=>/اسم الطالبة|اسم الطالب|full.?name|student.?name/i.test(String(v??''))));
        if(hi<0||baseHeaderIndex<0)throw new Error('تأكد أن كل شيت يحتوي على عناوين الرقم القومي واسم الطالبة.');
        const headers=baseGrid[baseHeaderIndex].map(v=>String(v??'').trim());
        const otherHeaders=item.grid[hi].map(v=>String(v??'').trim());
        if(headers.join('|')!==otherHeaders.join('|'))throw new Error('يجب أن تكون عناوين الأعمدة في شيت الصف الأول والثاني متطابقة. استخدم نموذج Excel الموجود في المنظومة.');
        const gradeIndex=headers.findIndex(v=>/^(الصف|الصف الدراسي|grade)$/i.test(String(v).trim()));
        const sheetGrade=/الثاني|second|grade\s*2/i.test(item.name)?'الثاني':'الأول';
        for(let ri=hi+1;ri<item.grid.length;ri++){const row=item.grid[ri].slice();if(gradeIndex>=0&&!String(row[gradeIndex]??'').trim())row[gradeIndex]=sheetGrade;grid.push(row);}
      }
      const gradeIndexAll=baseHeaderIndex>=0?baseGrid[baseHeaderIndex].findIndex(v=>/^(الصف|الصف الدراسي|grade)$/i.test(String(v).trim())):-1;
      if(gradeIndexAll>=0){for(const item of sheetGrids){const hi=item.grid.findIndex(row=>row.some(v=>/الرقم القومي|national.?id/i.test(String(v??'')))&&row.some(v=>/اسم الطالبة|اسم الطالب|full.?name|student.?name/i.test(String(v??''))));const sheetGrade=/الثاني|second|grade\s*2/i.test(item.name)?'الثاني':'الأول';for(let ri=hi+1;ri<item.grid.length;ri++){const row=item.grid[ri];if(row&&!String(row[gradeIndexAll]??'').trim()&&row.some(v=>String(v??'').trim()))row[gradeIndexAll]=sheetGrade;}}}
      if(grid.length<2)throw new Error('الملف لا يحتوي على صفوف بيانات.');
      if(grid.length<2)throw new Error('الملف لا يحتوي على صفوف بيانات.');
      // ابحث عن صف العناوين ضمن أول 10 صفوف، حتى لو سبقته عناوين أو بيانات المدرسة.
      const idAliases=['الرقم القومي','رقم قومي','الرقم القومى','رقم الطالبة القومي','الرقم القومي للطالبة','national_id','national id','nationalid','national identity','id number'];
      const nameAliases=['اسم الطالبة','اسم الطالب','اسم الطالبه','اسم الطالبة بالكامل','الاسم الكامل','اسم الطالبة/الطالب','full_name','student name','studentname','name'];
      let headerRow=-1,headers=[],idI=-1,nameI=-1;
      for(let hi=0;hi<Math.min(grid.length,10);hi++){
        const candidate=(grid[hi]||[]).map(v=>String(v??'').trim());
        const ci=examField(candidate,idAliases),cn=examField(candidate,nameAliases);
        if(ci>=0&&cn>=0){headerRow=hi;headers=candidate;idI=ci;nameI=cn;break;}
      }
      // عند اختلاف مسميات العناوين، حاول اكتشاف عمود الرقم القومي من قيمه الفعلية (14 رقمًا)
      // وعمود الاسم من النصوص المجاورة، بدل رفض الملف مباشرة.
      if(headerRow<0){
        let best=null;
        for(let hi=0;hi<Math.min(grid.length,20);hi++){
          const candidate=(grid[hi]||[]).map(v=>String(v??'').trim());
          const width=Math.max(candidate.length,...grid.slice(hi+1,Math.min(grid.length,hi+8)).map(r=>r.length),0);
          for(let ci=0;ci<width;ci++){
            let idScore=0;
            for(let ri=hi+1;ri<Math.min(grid.length,hi+8);ri++)if(/^\d{14}$/.test(examId(grid[ri]?.[ci])))idScore++;
            if(idScore<1)continue;
            for(let cn=0;cn<width;cn++){
              if(cn===ci)continue;
              let nameScore=0;
              for(let ri=hi+1;ri<Math.min(grid.length,hi+8);ri++){
                const val=String(grid[ri]?.[cn]??'').trim();
                if(val.length>=3&&!/^\d+$/.test(val)&&/[ء-يa-z]/i.test(val))nameScore++;
              }
              const score=idScore*3+nameScore;
              if(nameScore>0&&(!best||score>best.score))best={hi,ci,cn,score,candidate};
            }
          }
        }
        if(best){headerRow=best.hi;headers=best.candidate.slice();while(headers.length<=Math.max(best.ci,best.cn))headers.push('');idI=best.ci;nameI=best.cn;if(!headers[idI])headers[idI]='الرقم القومي';if(!headers[nameI])headers[nameI]='اسم الطالبة';}
      }
      if(headerRow<0)throw new Error('لم أتمكن من تحديد عمود الرقم القومي وعمود اسم الطالبة. تأكد أن الشيت يحتوي على أرقام قومية صحيحة وأسماء طالبات في صفوف البيانات.');
      const gradeI=examField(headers,['الصف','الصف الدراسي','المرحلة','grade','year']),sectionI=examField(headers,['الفصل','الشعبة','section','class']),specI=examField(headers,['التخصص','الشعبة التخصصية','specialization','specialty']),seatI=examField(headers,['رقم الجلوس','رقم جلوس','جلوس','seat number','seat_no','seat_number']),religionI=examField(headers,['الديانة','ديانة الطالبة','ديانة','religion']),totalI=examField(headers,['مجموع الطالبة','مجموع الطالبه','مجموع الطالب','درجة الطالبة','المجموع المحصل','المجموع الكلي','المجموع الكلى','total score','total_score','total','المجموع']),maxI=examField(headers,['الدرجة الكلية','الدرجة الكلية للطالبة','النهاية العظمى','إجمالي الدرجة النهائية','الدرجة النهائية','المجموع النهائي','max total','max_total','maximum','maximum total','total maximum']),principalI=examField(headers,['مدير المدرسة','اسم المدير','اسم مدير المدرسة','principal name','principal_name','school principal']),controllerI=examField(headers,['رئيس الكنترول','اسم رئيس الكنترول','رئيس لجنة الكنترول','اسم رئيس لجنة الكنترول','controller name','controller_name','head controller']),pctI=examField(headers,['النسبة','النسبة المئوية','percentage','percent']),statusI=examField(headers,['النتيجة','حالة النتيجة','الحالة العامة','حالة الطالب','حالة الطالبة','result','result status','result_status']),failedI=examField(headers,['مواد الدور الثاني','مواد الرسوب','مواد التخلف','failed subjects','subjects failed']);
      const serialI=examField(headers,['مسلسل','م','م.','تسلسل','serial','serial number']),reserved=new Set([idI,nameI,gradeI,sectionI,specI,seatI,religionI,totalI,maxI,principalI,controllerI,pctI,statusI,failedI,serialI].filter(i=>i>=0)),subjectHeaders=headers.map((h,i)=>({h,i})).filter(x=>x.h&&!reserved.has(x.i)),rows=[],errors=[],seen=new Set();
      let maxMarksRow=null,dataStart=headerRow+1,principalFromSheet='',controllerFromSheet='';
      const maxMarksRowIndexes=new Set();
      if(state.examMode==='half_year'){
        // نتيجة نصف العام: قد يأتي صف النهاية العظمى بعد صفوف الطالبات.
        for(let ri=headerRow+1;ri<grid.length;ri++){
          const cells=grid[ri]||[];
          const hasIdentity=!!examId(cells[idI])||!!examCell(cells,nameI);
          const numericSubjects=subjectHeaders.map(col=>({name:col.h,raw:examCell(cells,col.i)}))
            .filter(x=>x.raw!==''&&Number.isFinite(Number(x.raw.replace(/,/g,''))));
          if(!hasIdentity&&numericSubjects.length>=2){
            const candidate={};
            numericSubjects.forEach(x=>candidate[x.name]=Number(x.raw.replace(/,/g,'')));
            maxMarksRow=candidate;
            maxMarksRowIndexes.add(ri);
            const principal=examCell(cells,principalI),controller=examCell(cells,controllerI);
            if(principal)principalFromSheet=principal;
            if(controller)controllerFromSheet=controller;
          }
        }
      }else{
        // إبقاء طريقة استيراد نتيجة آخر العام كما هي دون تغيير.
        const firstData=grid[dataStart]||[];
        const firstHasIdentity=!!examId(firstData[idI])||!!examCell(firstData,nameI);
        const firstNumericSubjects=subjectHeaders.map(col=>({name:col.h,raw:examCell(firstData,col.i)})).filter(x=>x.raw!==''&&Number.isFinite(Number(x.raw.replace(/,/g,''))));
        if(!firstHasIdentity&&firstNumericSubjects.length){
          maxMarksRow={};firstNumericSubjects.forEach(x=>maxMarksRow[x.name]=Number(x.raw.replace(/,/g,'')));
          maxMarksRowIndexes.add(dataStart);
          principalFromSheet=examCell(firstData,principalI);
          controllerFromSheet=examCell(firstData,controllerI);
          dataStart++;
        }
      }
      for(let ri=dataStart;ri<grid.length;ri++){
        if(maxMarksRowIndexes.has(ri))continue;
        const cells=grid[ri];if(!cells.some(v=>String(v??'').trim()))continue;
        const national_id=examId(cells[idI]),full_name=examCell(cells,nameI);
        if(!/^\d{14}$/.test(national_id)){errors.push('الصف '+(ri+1)+': الرقم القومي ليس 14 رقمًا.');continue;}
        if(!full_name){errors.push('الصف '+(ri+1)+': اسم الطالبة فارغ.');continue;}
        const grade=examCell(cells,gradeI)||'غير محدد',key=[national_id,year,round,grade].join('|');
        if(seen.has(key)){errors.push('الصف '+(ri+1)+': تكرار الرقم القومي لنفس العام والدور والصف.');continue;}seen.add(key);
        const subjects={};for(const col of subjectHeaders){const raw=examCell(cells,col.i);if(raw!=='')subjects[col.h]=raw;}
        const numericSubjects=subjectHeaders.map(col=>({raw:examCell(cells,col.i)})).filter(x=>x.raw!=='').map(x=>Number(x.raw.replace(/,/g,''))).filter(Number.isFinite);
        const totalRaw=examCell(cells,totalI),maxRaw=examCell(cells,maxI),pctRaw=examCell(cells,pctI);
        const total=totalRaw!==''&&Number.isFinite(Number(totalRaw.replace(/,/g,'')))?Number(totalRaw.replace(/,/g,'')):null;
        const explicitMax=maxRaw!==''&&Number.isFinite(Number(maxRaw.replace(/,/g,'')))?Number(maxRaw.replace(/,/g,'')):null;const subjectMaxSum=maxMarksRow?Object.entries(maxMarksRow).filter(([name])=>!/(?:التربية\s*القومية|التربية\s*الدينية|تربية\s*قومية|تربية\s*دينية)/.test(name)).reduce((sum,[,value])=>sum+(Number.isFinite(Number(value))?Number(value):0),0):null;const maxTotal=explicitMax!==null?explicitMax:(subjectMaxSum!==null&&subjectMaxSum>0?subjectMaxSum:null);
        const percentage=pctRaw!==''&&Number.isFinite(Number(pctRaw.replace(/[% ,]/g,'')))?Number(pctRaw.replace(/[% ,]/g,'')):null;
        rows.push({national_id,full_name,grade,section:examCell(cells,sectionI)||null,specialization:examCell(cells,specI)||null,seat_number:examCell(cells,seatI)||null,academic_year:year,exam_round:round,subjects,subject_max_marks:maxMarksRow||null,failed_subjects:examCell(cells,failedI)||null,total,max_total:maxTotal,percentage,result_status:examCell(cells,statusI)||null,principal_name:examCell(cells,principalI)||principalFromSheet||null,controller_name:examCell(cells,controllerI)||controllerFromSheet||null,source_file:file.name,imported_by:state.user.id});
      }
      if(!rows.length)throw new Error('لم توجد صفوف صالحة للحفظ. '+errors.slice(0,4).join(' '));
      let saved=0;for(let i=0;i<rows.length;i+=100){const {error}=await state.client.from('exam_results').upsert(rows.slice(i,i+100),{onConflict:'national_id,academic_year,exam_round,grade'});if(error)throw new Error('تعذر حفظ النتائج في قاعدة البيانات: '+error.message);saved+=Math.min(100,rows.length-i);}
      let codeFileNote='';
      try{
        const {data:{session}}=await state.client.auth.getSession();
        const issued=await callAccessFunction({action:'issue_exam_codes',result_type:state.examMode,academic_year:year,exam_round:round},session?.access_token||null);
        if(!Array.isArray(issued.codes)||!issued.codes.length)throw new Error('لم يتم إرجاع رموز دخول.');
        const resultHeaders=['الرقم القومي','اسم الطالبة','رقم الجلوس','الصف','الفصل','التخصص',...subjectHeaders.map(x=>x.h),'المجموع الكلي','النهاية العظمى','النسبة المئوية','النتيجة','مواد الرسوب','مواد الدور الثاني','رئيس الكنترول','مدير المدرسة'];
        const maxMarksExport=['','','','','','',...subjectHeaders.map(x=>maxMarksRow?.[x.h]??''),'','','','','','','',''];
        const resultRows=rows.map(r=>[
          String(r.national_id||''),r.full_name||'',r.seat_number||'',r.grade||'',r.section||'',r.specialization||'',
          ...subjectHeaders.map(x=>r.subjects?.[x.h]??''),
          r.total??'',r.max_total??'',r.percentage??'',r.result_status||'',
          r.failed_subjects||'',r.failed_subjects||'',r.controller_name||'',r.principal_name||''
        ]);
        const resultWs=XLSX.utils.aoa_to_sheet([resultHeaders,maxMarksExport,...resultRows]);
        resultWs['!views']=[{rightToLeft:true}];
        resultWs['!cols']=resultHeaders.map((h,i)=>({wch:i===0?20:i===1?30:i===2?14:i>=6&&i<6+subjectHeaders.length?16:18}));
        resultWs['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(1,resultRows.length+1),c:resultHeaders.length-1}})};
        resultWs['!freeze']={xSplit:2,ySplit:2};
        // احتفظ بنسخة من كل شيت رفعه المستخدم كما هو، وأضف عمود رمز الدخول فقط.
        const normalizeStudentId=value=>{const id=examId(value);return id?id.padStart(14,'0'):'';};
        const normalizeStudentName=value=>examHeader(value).replace(/[^a-z0-9ء-ي]/g,'');
        const codeById=new Map(),codeByName=new Map();
        issued.codes.forEach(r=>{
          const code=String(r.access_code??r.entry_code??r.code??'');
          const id=normalizeStudentId(r.national_id);
          const name=normalizeStudentName(r.full_name??r.student_name??r.name);
          if(id&&code)codeById.set(id,code);
          if(name&&code)codeByName.set(name,code);
        });
        const uploadedCodeSheets=sheetGrids.map(item=>{
          const data=item.grid.map(row=>row.slice());
          const hi=data.findIndex(row=>row.some(v=>/الرقم القومي|national.?id/i.test(String(v??'')))&&row.some(v=>/اسم الطالبة|اسم الطالب|full.?name|student.?name/i.test(String(v??''))));
          if(hi<0)return null;
          const hdr=data[hi].map(v=>String(v??'').trim());
          const idCol=examField(hdr,['الرقم القومي','رقم قومي','الرقم القومى','رقم الطالبة القومي','الرقم القومي للطالبة','national_id','national id','nationalid','id number']);
          const nameCol=examField(hdr,['اسم الطالبة','اسم الطالب','اسم الطالبه','اسم الطالبة بالكامل','الاسم الكامل','full_name','student name','studentname','name']);
          if(idCol<0)return null;
          const codeCol=hdr.length;
          data[hi][codeCol]='رمز الدخول';
          let matched=0;
          for(let ri=hi+1;ri<data.length;ri++){
            const row=data[ri]||[];
            const id=normalizeStudentId(row[idCol]);
            const name=nameCol>=0?normalizeStudentName(row[nameCol]):'';
            const code=(id&&codeById.get(id))||(name&&codeByName.get(name))||'';
            if(code){row[codeCol]=code;matched++;}
          }
          if(matched===0)console.warn('No exam access codes matched uploaded sheet:',item.name,'codes:',issued.codes.length);
          const ws=XLSX.utils.aoa_to_sheet(data);
          ws['!views']=[{rightToLeft:true}];
          ws['!cols']=[...hdr.map(h=>({wch:Math.max(12,Math.min(30,String(h||'').length+5))})),{wch:16}];
          return {name:item.name,ws,matched};
        }).filter(Boolean);
        if(!uploadedCodeSheets.some(s=>s.matched>0))throw new Error('صدرت رموز الدخول، لكن لم أتمكن من مطابقة الأرقام القومية مع الشيت المرفوع. تأكد أن عمود الرقم القومي موجود في الشيت.');

        const wb=XLSX.utils.book_new();
        if(state.examMode==='half_year'){
          const gradeOf=r=>{const g=examHeader(r.grade||'');return /الثاني|^2$|grade2|second/.test(g)?'الثاني':'الأول';};
          const makeGradeSheet=(gradeLabel)=>{
            const selected=resultRows.filter((row,i)=>gradeOf(rows[i])===gradeLabel);
            const data=[resultHeaders,maxMarksExport,...selected];
            const ws=XLSX.utils.aoa_to_sheet(data);
            ws['!views']=[{rightToLeft:true}];
            ws['!cols']=resultHeaders.map((h,i)=>({wch:i===0?20:i===1?30:i===2?14:i>=6&&i<6+subjectHeaders.length?16:18}));
            ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(1,data.length-1),c:resultHeaders.length-1}})};
            ws['!freeze']={xSplit:2,ySplit:2};
            return ws;
          };
          const firstGradeWs=makeGradeSheet('الأول');
          const secondGradeWs=makeGradeSheet('الثاني');
          XLSX.utils.book_append_sheet(wb,firstGradeWs,'الصف الأول');
          XLSX.utils.book_append_sheet(wb,secondGradeWs,'الصف الثاني');
          uploadedCodeSheets.forEach((s,i)=>XLSX.utils.book_append_sheet(wb,s.ws,(s.name||('شيت '+(i+1))).slice(0,22)+' - برموز'));
          XLSX.writeFile(wb,'نتائج_نصف_العام_الصف_الأول_والثاني_'+year.replace('/','-')+'.xlsx');
          codeFileNote=' تم تنزيل ملف Excel بنتائج الصفين، بالإضافة إلى نسخة من كل شيت رفعته حضرتك بعد إضافة عمود رمز الدخول فقط. كل رمز صالح لخمس مرات.';
        }else{
          XLSX.utils.book_append_sheet(wb,resultWs,'بيانات ودرجات الطالبات');
          uploadedCodeSheets.forEach((s,i)=>XLSX.utils.book_append_sheet(wb,s.ws,(s.name||('شيت '+(i+1))).slice(0,22)+' - برموز'));
          XLSX.writeFile(wb,'بيانات_ودرجات_ورموز_الطالبات_'+year.replace('/','-')+'.xlsx');
          codeFileNote=' تم تنزيل ملف Excel يحتوي على بيانات النتائج، بالإضافة إلى نسخة من الشيت المرفوع بعد إضافة عمود رمز الدخول فقط. كل رمز صالح لخمس مرات.';
        }
      }catch(codeErr){console.error('Issue student access codes error:',codeErr);codeFileNote=' تم حفظ النتائج، لكن تعذر إصدار ملف رموز الدخول: '+(codeErr?.message||String(codeErr))+'.';}
      msg.className='message '+(errors.length?'error':'success');msg.textContent='تم حفظ/تحديث '+saved+' نتيجة من ملف «'+file.name+'». '+(errors.length?'تم تجاوز '+errors.length+' صف غير صالح. أول الملاحظات: '+errors.slice(0,5).join(' | '):'لم توجد أخطاء في الصفوف.')+codeFileNote;
    }catch(err){msg.className='message error';msg.textContent='تعذر استيراد الشيت: '+(err?.message||String(err));}
    finally{btn.disabled=false;}
  }
  async function loadExamResults(){
    const body=$('#tableBody');if(!body||!admin())return;
    body.innerHTML='<tr><td class="empty" colspan="8">جارٍ تحميل النتائج...</td></tr>';
    const year=$('#examSearchYear')?.value.trim()||'2026/2027',round=$('#examSearchRound')?.value||'الدور الأول',term=$('#examSearch')?.value.trim()||'';
    let query=state.client.from('exam_results').select('*').eq('academic_year',year).eq('exam_round',round).order('full_name').limit(2000);
    if(/^\d{14}$/.test(examId(term)))query=query.eq('national_id',examId(term));
    const {data,error}=await query;
    if(error){$('#tableHead').innerHTML='';body.innerHTML='';say('#sectionMsg','تعذر تحميل نتائج الامتحانات: '+error.message,'error');return;}
    let rows=data||[];if(term&&!/^\d{14}$/.test(examId(term)))rows=rows.filter(r=>String(r.full_name||'').includes(term));
    $('#tableHead').innerHTML='<tr><th>الرقم القومي</th><th>اسم الطالبة</th><th>الصف</th><th>التخصص</th><th>المواد والدرجات</th><th>المجموع</th><th>النسبة</th><th>النتيجة</th></tr>';
    if(!rows.length){body.innerHTML='<tr><td class="empty" colspan="8">لا توجد نتائج مطابقة. ارفع شيت Excel أو غيّر البحث والعام والدور.</td></tr>';return;}
    body.innerHTML=rows.map(r=>'<tr><td>'+esc(r.national_id)+'</td><td>'+esc(r.full_name)+'</td><td>'+esc(r.grade||'—')+'</td><td>'+esc(r.specialization||'—')+'</td><td>'+esc(Object.entries(r.subjects||{}).map(([k,v])=>k+': '+v).join('، ')||'—')+'</td><td>'+esc(r.total??'—')+(r.max_total!==null&&r.max_total!==undefined?' / '+esc(r.max_total):'')+'</td><td>'+esc(r.percentage??'—')+(r.percentage!==null&&r.percentage!==undefined?'%':'')+'</td><td>'+esc(r.result_status||'—')+'</td></tr>').join('');
    say('#sectionMsg','عدد النتائج المعروضة: '+rows.length+(rows.length===2000?' (تم الوصول إلى حد العرض 2000 نتيجة)':''),'success');
  }
  function downloadExamTemplate(){
    if(typeof XLSX==='undefined'){window.alert('مكتبة Excel غير متاحة.');return;}
    // نموذج ثابت داخل المنظومة: شيت مستقل لكل صف، وصف النهاية العظمى أسفل العناوين.
    const halfYear = state.examMode === 'half_year';
    const headers = halfYear
      ? ['مسلسل','رقم الجلوس','اسم الطالبة','الرقم القومي','الديانة','الصف','التخصص','اللغة العربية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','الدراسات الاجتماعية','الحاسب الآلي','الوحدة الأولى','الوحدة الثانية','الوحدة الثالثة','الوحدة الرابعة','الوحدة الخامسة','المجموع','التربية القومية','التربية الدينية','رئيس الكنترول','مدير المدرسة']
      : ['الرقم القومي','اسم الطالبة','رقم الجلوس','الصف','الفصل','التخصص','لغة عربية','لغة إنجليزية','رياضيات','فيزياء','كيمياء','دراسات اجتماعية','حاسب آلي','الوحدة الأولى','الوحدة الثانية','الوحدة الثالثة','الوحدة الرابعة','الوحدة الخامسة','الوحدة السادسة','الوحدة السابعة','الوحدة الثامنة','الوحدة التاسعة','تربية دينية','تربية قومية','المجموع','النهاية العظمى','النسبة المئوية','النتيجة','مواد الرسوب','مواد الدور الثاني','رئيس الكنترول','مدير المدرسة'];
    const maxMarks = halfYear
      ? ['','','','','','','',25,20,15,10,10,10,10,'','','','', '',100,10,10,'','']
      : ['','','','','','',50,40,30,20,20,20,20,'','','','','','','','','','','','','','','','','',''];
    const makeSheet=(grade)=>{const ws=XLSX.utils.aoa_to_sheet([headers,maxMarks]);ws['!views']=[{rightToLeft:true}];ws['!cols']=headers.map((h,i)=>({wch:/اسم الطالبة/.test(h)?30:/الرقم القومي/.test(h)?20:/رقم الجلوس/.test(h)?15:/رئيس الكنترول|مدير المدرسة/.test(h)?24:/الوحدة/.test(h)?16:18}));ws['!autofilter']={ref:'A1:'+XLSX.utils.encode_col(headers.length-1)+'2'};ws['!freeze']={xSplit:3,ySplit:2};return ws;};
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,makeSheet('الأول'),'الصف الأول');
    XLSX.utils.book_append_sheet(wb,makeSheet('الثاني'),'الصف الثاني');
    XLSX.writeFile(wb,state.examMode==='half_year'?'نتيجة_الفصل_الدراسي_الأول_الصف_الأول_والثاني.xlsx':'نموذج_نتائج_الامتحانات_الصف_الأول_والثاني.xlsx');
  }
  async function downloadExamSummaryTemplate(){
    if(typeof XLSX==='undefined'){window.alert('مكتبة Excel غير متاحة.');return;}
    const headers=['مسلسل','اسم الطالبة','الرقم القومي','رقم الجلوس','الصف','التخصص','حالة الطالبة','مجموع الطالبة','المجموع الكلي','مواد الدور الثاني','رئيس الكنترول','مدير المدرسة'];
    const year=$('#examAcademicYear')?.value.trim()||'2026/2027';
    const {data,error}=await state.client.from('exam_results').select('*').eq('academic_year',year).eq('exam_round','الدور الأول').order('full_name').limit(5000);
    if(error){say('#examImportMsg','تعذر جلب مواد الدور الثاني: '+error.message,'error');return;}
    const students=(data||[]).map(r=>{
      const raw=r.failed_subjects??r.subjects_failed??r.failing_subjects??r.second_round_subjects??r.materials_second_round??r['مواد الدور الثاني']??'';
      const subjects=Array.isArray(raw)?raw.join('، '):String(raw||'').trim();
      const status=String(r.result_status||'').trim();
      return {r,subjects,status};
    }).filter(x=>x.subjects && !/^(لا يوجد|لا توجد|ناجح|ناجحة|—|-|0)$/i.test(x.subjects) && (/دور\s*ثاني|دور ثان|ثان/i.test(x.status)||x.subjects.length>0));
    const rows=[headers,...students.map(({r,subjects},i)=>[i+1,r.full_name||'',r.national_id||'',r.seat_number||'',r.grade||'',r.specialization||'',r.result_status||'دور ثاني',r.total??'',r.max_total??'',subjects,r.controller_name||'',r.principal_name||''])];
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!views']=[{rightToLeft:true}];
    ws['!cols']=[{wch:9},{wch:30},{wch:20},{wch:15},{wch:14},{wch:28},{wch:24},{wch:16},{wch:16},{wch:32},{wch:24},{wch:24}];
    ws['!autofilter']={ref:'A1:L'+Math.max(1,rows.length)};
    ws['!freeze']={xSplit:0,ySplit:1};
    const wb=XLSX.utils.book_new();
    const halfYear = state.examMode === 'half_year';
    XLSX.utils.book_append_sheet(wb,ws,halfYear?'نتيجة الصف الأول والثاني':'ملخص النتائج');
    XLSX.writeFile(wb,halfYear?'نتيجة_الصف_الأول_والثاني.xlsx':'شيت_ملخص_النتائج_والتوقيعات.xlsx');
    say('#examImportMsg',students.length?'تم تنزيل الملخص بمواد الدور الثاني للطالبات المستحقات فقط.':'لا توجد طالبات مسجلات لهن مواد دور ثانٍ في نتائج الدور الأول لهذا العام.','success');
  }
  async function exportExamResults(){
    if(typeof XLSX==='undefined'){window.alert('مكتبة Excel غير متاحة.');return;}
    const year=$('#examSearchYear')?.value.trim()||'2026/2027',round=$('#examSearchRound')?.value||'الدور الأول';
    const {data,error}=await state.client.from('exam_results').select('*').eq('academic_year',year).eq('exam_round',round).order('full_name').limit(5000);
    if(error){say('#sectionMsg','تعذر تصدير النتائج: '+error.message,'error');return;}
    const rows=(data||[]).map(r=>({'الرقم القومي':r.national_id,'اسم الطالبة':r.full_name,'الصف':r.grade,'الفصل':r.section,'التخصص':r.specialization,'المواد والدرجات':Object.entries(r.subjects||{}).map(([k,v])=>k+': '+v).join(' | '),'المجموع':r.total,'النهاية العظمى':r.max_total,'النسبة المئوية':r.percentage,'النتيجة':r.result_status,'مواد الدور الثاني':Array.isArray(r.failed_subjects)?r.failed_subjects.join('، '):(r.failed_subjects??r.subjects_failed??r.failing_subjects??''),'رئيس الكنترول':r.controller_name,'مدير المدرسة':r.principal_name,'العام الدراسي':r.academic_year,'الدور':r.exam_round}));
    const ws=XLSX.utils.json_to_sheet(rows);ws['!views']=[{rightToLeft:true}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'نتائج الامتحانات');XLSX.writeFile(wb,'نتائج_الامتحانات_'+year.replace('/','-')+'.xlsx');
  }
  function updateHomeTiles(){ document.querySelectorAll('#homeTabs [data-home-section="export"]').forEach(tile=>{tile.classList.toggle('hidden',!admin());}); document.querySelectorAll('#homeTabs [data-home-section="students"]').forEach(tile=>tile.classList.toggle('hidden',!admin())); document.querySelectorAll('#homeTabs [data-home-section="third_grade_forms"]').forEach(tile=>tile.classList.toggle('hidden',!admin())); document.querySelectorAll('#homeTabs [data-home-section="exam_results"]').forEach(tile=>tile.classList.remove('hidden')); }
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
    const admissionsSettingsHtml = sec.table==='students' && admin() ? `<section class="panel admissions-settings-panel" style="margin-bottom:16px;padding:16px;border:1px solid #cbd5e1;border-radius:12px"><h3 style="margin-top:0">إعدادات توزيع الطالبات — قابلة للتغيير</h3><p>غيّر الأعداد حسب العام الدراسي، ثم احفظ الإعدادات. ستظل محفوظة في المنظومة ويمكن تعديلها لاحقًا.</p><div class="form-grid"><label>العام الدراسي للإعدادات<select id="distAcademicYear"><option>2025/2026</option><option selected>2026/2027</option><option>2027/2028</option><option>2028/2029</option><option>2029/2030</option></select></label><label>سعة فني تكنولوجيا الحاسبات<input id="distComputerCapacity" type="number" min="0" step="1" value="0" required></label><label>سعة فني الأجهزة الإلكترونية<input id="distElectronicsCapacity" type="number" min="0" step="1" value="0" required></label><label>سعة فني الملابس الجاهزة<input id="distGarmentsCapacity" type="number" min="0" step="1" value="0" required></label><label>الحد الأقصى لطالبات الفصل<input id="distClassSize" type="number" min="1" max="100" step="1" value="35" required></label></div><div class="form-actions"><button id="saveAdmissionsSettings" type="button">حفظ شروط التوزيع</button><button id="exportAdmissionsStudents" type="button" class="secondary">استخراج شيت بيانات الطالبات كاملة</button><button id="exportAdmissionsClasses" type="button" class="secondary">استخراج قوائم الفصول بعد التوزيع</button><button id="exportAdmission41" type="button" class="secondary">استخراج كشف ٤١</button></div><div id="admissionsSettingsMsg" class="message" aria-live="polite"></div><div class="admissions-bulk-import" style="margin-top:16px;padding-top:14px;border-top:1px solid #cbd5e1"><h4 style="margin:0 0 8px">إدخال بيانات الطالبات من ملف Excel</h4><p>ارفع شيتًا يحتوي على صف عناوين ثم بيانات الطالبات. يمكن أن تكون الأعمدة بالعربية أو بأسماء الحقول الإنجليزية، وبأي ترتيب.</p><label for="admissionsExcelFile">اختيار ملف Excel</label><input id="admissionsExcelFile" type="file" accept=".xlsx,.xls,.csv"><div class="form-actions"><button id="previewAdmissionsExcel" type="button" class="secondary">مراجعة الشيت</button><button id="importAdmissionsExcel" type="button" disabled>استيراد الطالبات إلى المنظومة</button></div><div id="admissionsExcelPreview" class="message" aria-live="polite"></div></div></section>` : '';
    host.innerHTML=`${admissionsSettingsHtml}<form id="recordForm" class="form-grid">${fields.map(fieldHTML).join('')}<div class="form-actions"><button type="submit">${employeeMode&&sec.table==='staff'?'حفظ بياناتي':'حفظ'}</button></div></form>`;
    if(sec.table==='students' && admin()) setupAdmissionsSettings();
    if(sec.table==='students'){
      const nameInput=$('[name="full_name"]'),idInput=$('[name="national_id"]'),fatherInput=$('[name="father_name"]'),birthInput=$('[name="birth_date"]'),yearInput=$('[name="academic_year"]'),ageInput=$('[name="age_at_october"]');
      if(yearInput)yearInput.value='2026/2027';
      if(birthInput)birthInput.readOnly=true;if(ageInput)ageInput.readOnly=true;
      const derive=()=>{
        if(fatherInput){const parts=(nameInput?.value||'').trim().split(/\s+/).filter(Boolean);fatherInput.value=parts.length>=2?parts[1]:'';}
        const id=(idInput?.value||'').replace(/\\s/g,'');
        let birth='';
        if(/^\\d{14}$/.test(id)){
          const century=id[0]==='2'?1900:id[0]==='3'?2000:0;
          const yy=Number(id.slice(1,3)),mm=Number(id.slice(3,5)),dd=Number(id.slice(5,7));
          if(century&&mm>=1&&mm<=12&&dd>=1&&dd<=31){const date=new Date(century+yy,mm-1,dd);if(date.getFullYear()===century+yy&&date.getMonth()===mm-1&&date.getDate()===dd)birth=date.getFullYear()+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0');}
        }
        if(birthInput)birthInput.value=birth;
        const startYear=Number((yearInput?.value||'2026/2027').split('/')[0]);
        if(ageInput){if(birth&&startYear){const b=new Date(birth+'T00:00:00'),target=new Date(startYear,9,1);let months=(target.getFullYear()-b.getFullYear())*12+target.getMonth()-b.getMonth();if(target.getDate()<b.getDate())months--;if(months>=0){ageInput.value=Math.floor(months/12)+' سنة و'+(months%12)+' شهر';}else ageInput.value='تاريخ الميلاد بعد أول أكتوبر';}else ageInput.value='';}
      };
      nameInput?.addEventListener('input',derive);idInput?.addEventListener('input',derive);yearInput?.addEventListener('change',derive);derive();
    }
    for(const f of fields){const [name,,type,,extra]=f;if(type==='select'&&(extra==='staff'||extra==='students')){const list=await getOptions(extra);const select=$(`[name="${name}"]`);if(select)select.innerHTML='<option value="">اختر...</option>'+list.map(r=>`<option value="${esc(r.id)}">${esc(r.full_name)}</option>`).join('');}}
    if(employeeMode&&sec.table==='staff'&&state.staffRecord){for(const f of fields){const el=$(`[name="${f[0]}"]`);if(el)el.value=state.staffRecord[f[0]]??'';}}
    $('#recordForm').addEventListener('submit',e=>saveRecord(e,sec));
  }

  async function setupAdmissionsSettings(){
    const year=$('#distAcademicYear'),computer=$('#distComputerCapacity'),electronics=$('#distElectronicsCapacity'),garments=$('#distGarmentsCapacity'),classSize=$('#distClassSize'),save=$('#saveAdmissionsSettings');
    if(!year||!save)return;
    const load=async()=>{
      say('#admissionsSettingsMsg','جارٍ تحميل شروط التوزيع...');
      const {data,error}=await state.client.from('admissions_distribution_settings').select('*').eq('academic_year',year.value).maybeSingle();
      if(error){say('#admissionsSettingsMsg','تعذر تحميل الإعدادات: '+error.message,'error');return;}
      computer.value=data?.computer_capacity??0;electronics.value=data?.electronics_capacity??0;garments.value=data?.garments_capacity??0;classSize.value=data?.class_size??35;
      say('#admissionsSettingsMsg',data?'تم تحميل الإعدادات المحفوظة لهذا العام الدراسي.':'لا توجد إعدادات محفوظة لهذا العام؛ أدخل الأعداد المطلوبة ثم احفظها.');
    };
    year.addEventListener('change',load);
    $('#exportAdmissionsStudents')?.addEventListener('click',exportAdmissionsStudents);
    $('#exportAdmissionsClasses')?.addEventListener('click',exportAdmissionsClassLists);
    $('#exportAdmission41')?.addEventListener('click',()=>window.alert('زر كشف ٤١ جاهز. أرسل تصميم الكشف والبيانات المطلوبة لأربطه بالتنسيق الصحيح.'));
    $('#previewAdmissionsExcel')?.addEventListener('click',previewAdmissionsExcelFile);
    $('#importAdmissionsExcel')?.addEventListener('click',importAdmissionsExcelFile);
    save.addEventListener('click',async()=>{
      const values=[computer.value,electronics.value,garments.value,classSize.value].map(Number);
      if(values.some(v=>!Number.isInteger(v)||v<0)||values[3]<1||values[3]>100){say('#admissionsSettingsMsg','أدخل أعدادًا صحيحة غير سالبة، واجعل سعة الفصل من 1 إلى 100.','error');return;}
      if(values[0]+values[1]+values[2]===0){say('#admissionsSettingsMsg','يجب تحديد سعة تخصص واحد على الأقل.','error');return;}
      save.disabled=true;save.textContent='جارٍ الحفظ...';
      try{
        const payload={academic_year:year.value,computer_capacity:values[0],electronics_capacity:values[1],garments_capacity:values[2],class_size:values[3],updated_by:state.user?.id||null,updated_at:new Date().toISOString()};
        const {error}=await state.client.from('admissions_distribution_settings').upsert(payload,{onConflict:'academic_year'});
        if(error)throw error;
        say('#admissionsSettingsMsg','تم حفظ شروط التوزيع لهذا العام الدراسي. يمكنك تغييرها في أي وقت.','success');
      }catch(err){say('#admissionsSettingsMsg','تعذر حفظ شروط التوزيع: '+(err?.message||String(err)),'error');}
      finally{save.disabled=false;save.textContent='حفظ شروط التوزيع';}
    });
    await load();
  }

  const admissionsHeaderAliases={
    full_name:['اسم الطالبة بالكامل','اسم الطالبة','اسم الطالبه','الاسم بالكامل','اسم الطالب','الاسم','full_name','student_name','name'],
    national_id:['الرقم القومي','الرقم القومى','الرقم القومي للطالبة','رقم قومي','national_id','nationalid','national_number'],
    father_name:['اسم الأب','اسم الاب','father_name','father_name'],
    birth_date:['تاريخ الميلاد','birth_date','birthdate'],
    academic_year:['العام الدراسي','العام الدراسى','السنة الدراسية','academic_year','school_year'],
    age_at_october:['السن في أول أكتوبر','السن فى اول اكتوبر','السن','age_at_october','age'],
    total_score:['المجموع','المجموع الكلي','المجموع الكلى','مجموع الدرجات','total_score','total','score'],
    preparatory_school:['المدرسة الإعدادية','المدرسة الاعدادية','اسم المدرسة الإعدادية','المدرسة','preparatory_school'],
    guardian_job:['وظيفة ولي الأمر','وظيفة ولى الأمر','وظيفة ولي الامر','وظيفة الأب','guardian_job'],
    guardian_phone:['تليفون ولي الأمر','تليفون ولى الأمر','رقم تليفون ولي الأمر','رقم الهاتف','رقم التليفون','guardian_phone','phone'],
    address:['العنوان','عنوان الطالبة','عنوان ولي الأمر','عنوان ولى الأمر','address'],
    specialization:['التخصص','الشعبة','specialization'],
    section:['الفصل','الفصل الدراسي','section'],
    grade:['الصف','الصف الدراسي','grade'],
    enrollment_status:['حالة القيد','الحالة','enrollment_status']
  };
  function admissionsNormalizeHeader(value){return String(value??'').trim().toLowerCase().replace(/[ـًٌٍَُِّْٰ]/g,'').replace(/[\s_\-().:]/g,'');}
  function admissionsCell(row,aliases){
    const keys=Object.keys(row||{}),wanted=new Set(aliases.map(admissionsNormalizeHeader));
    const key=keys.find(k=>wanted.has(admissionsNormalizeHeader(k)));
    return key===undefined?'':row[key];
  }
  function admissionsPrepareImportRow(row,year){
    const get=k=>admissionsCell(row,admissionsHeaderAliases[k]);
    const data={};
    for(const key of Object.keys(admissionsHeaderAliases)){const value=get(key);if(value!==''&&value!==null&&value!==undefined)data[key]=String(value).trim();}
    data.national_id=String(data.national_id||'').replace(/[\s\u200e\u200f]/g,'');
    data.academic_year=data.academic_year||year;
    if(!data.full_name)return {error:'اسم الطالبة غير موجود'};
    if(!/^\d{14}$/.test(data.national_id))return {error:'الرقم القومي يجب أن يتكون من 14 رقمًا'};
    const id=data.national_id,century=id[0]==='2'?1900:id[0]==='3'?2000:0;
    const yy=Number(id.slice(1,3)),mm=Number(id.slice(3,5)),dd=Number(id.slice(5,7));
    if(!century||mm<1||mm>12||dd<1||dd>31)return {error:'الرقم القومي لا يحتوي على تاريخ ميلاد صالح'};
    const birth=new Date(century+yy,mm-1,dd);
    if(birth.getFullYear()!==century+yy||birth.getMonth()!==mm-1||birth.getDate()!==dd)return {error:'تاريخ الميلاد في الرقم القومي غير صحيح'};
    data.birth_date=(century+yy)+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
    data.father_name=data.father_name||((data.full_name||'').trim().split(/\s+/)[1]||'');
    const startYear=Number(String(data.academic_year||year).split('/')[0]),target=new Date(startYear,9,1);
    let months=(target.getFullYear()-birth.getFullYear())*12+target.getMonth()-birth.getMonth();if(target.getDate()<birth.getDate())months--;
    data.age_at_october=months>=0?Math.floor(months/12)+' سنة و'+(months%12)+' شهر':'تاريخ الميلاد بعد أول أكتوبر';
    if(data.total_score===undefined||data.total_score===''||!Number.isFinite(Number(String(data.total_score).replace(/,/g,''))))return {error:'المجموع غير موجود أو غير صحيح'};
    data.total_score=Number(String(data.total_score).replace(/,/g,''));
    if(!data.preparatory_school)return {error:'المدرسة الإعدادية غير موجودة'};
    if(!data.guardian_job)return {error:'وظيفة ولي الأمر غير موجودة'};
    if(!data.guardian_phone)return {error:'تليفون ولي الأمر غير موجود'};
    if(!data.address)return {error:'العنوان غير موجود'};
    data.student_code='ADM-'+id;data.grade=data.grade||'الأول';data.specialization=data.specialization||'غير موزعة';data.section=data.section||'غير موزع';data.enrollment_status=data.enrollment_status||'مقيدة';
    return {data};
  }
  async function previewAdmissionsExcelFile(){
    const input=$('#admissionsExcelFile'),preview=$('#admissionsExcelPreview'),importBtn=$('#importAdmissionsExcel');
    if(!input?.files?.length){say('#admissionsExcelPreview','اختر ملف Excel أولًا.','error');return;}
    if(typeof XLSX==='undefined'){say('#admissionsExcelPreview','مكتبة قراءة Excel غير متاحة. حدّث الصفحة وحاول مرة أخرى.','error');return;}
    const btn=$('#previewAdmissionsExcel');btn.disabled=true;btn.textContent='جارٍ فحص الشيت...';importBtn.disabled=true;
    try{
      const file=input.files[0],book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
      const sheet=book.Sheets[book.SheetNames[0]];
      const raw=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
      if(!raw.length)throw new Error('الملف لا يحتوي على صفوف بيانات بعد صف العناوين.');
      const year=$('#distAcademicYear')?.value||'2026/2027',valid=[],errors=[],seen=new Set();
      raw.forEach((r,i)=>{
        if(Object.values(r).every(v=>String(v??'').trim()===''))return;
        const result=admissionsPrepareImportRow(r,year);
        if(result.error){errors.push({row:i+2,error:result.error});return;}
        const key=result.data.academic_year+'|'+result.data.national_id;
        if(seen.has(key)){errors.push({row:i+2,error:'رقم قومي مكرر داخل الملف لنفس العام الدراسي'});return;}
        seen.add(key);valid.push(result.data);
      });
      if(!valid.length)throw new Error('لم توجد صفوف صالحة للاستيراد. راجع عناوين الأعمدة والبيانات المطلوبة.');
      state.pendingAdmissionsImport={fileName:file.name,rows:valid,errors,year};
      const errorHtml=errors.length?'<details style="margin-top:8px"><summary>صفوف تحتاج إلى مراجعة ('+errors.length+')</summary><ul>'+errors.slice(0,30).map(e=>'<li>الصف '+e.row+': '+esc(e.error)+'</li>').join('')+(errors.length>30?'<li>وهناك أخطاء أخرى...</li>':'')+'</ul></details>':'';
      preview.innerHTML='<p>الملف: <strong>'+esc(file.name)+'</strong></p><p>صفوف صالحة للاستيراد: <strong>'+valid.length+'</strong></p><p>صفوف مستبعدة بسبب أخطاء: <strong>'+errors.length+'</strong></p><p>العام الدراسي الافتراضي للصفوف التي لا تحتوي على عام: '+esc(year)+'</p>'+errorHtml;
      importBtn.disabled=false;say('#admissionsSettingsMsg','تمت مراجعة الملف. لم تُحفظ البيانات بعد؛ اضغط الاستيراد بعد التأكد.','success');
    }catch(err){state.pendingAdmissionsImport=null;say('#admissionsExcelPreview','تعذر قراءة الملف: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=false;btn.textContent='مراجعة الشيت';}
  }
  async function importAdmissionsExcelFile(){
    if(!admin())return;
    const pending=state.pendingAdmissionsImport,btn=$('#importAdmissionsExcel');
    if(!pending?.rows?.length){say('#admissionsExcelPreview','راجع ملف Excel أولًا.','error');return;}
    if(!window.confirm('سيتم استيراد '+pending.rows.length+' طالبة للعام الدراسي المحدد، مع تخطي الأرقام القومية المسجلة مسبقًا في العام نفسه. هل تريد المتابعة؟'))return;
    btn.disabled=true;btn.textContent='جارٍ الاستيراد...';
    try{
      const year=pending.year,allIds=[...new Set(pending.rows.filter(r=>r.academic_year===year).map(r=>r.national_id))],existing=new Set();
      for(let i=0;i<allIds.length;i+=100){
        const part=allIds.slice(i,i+100);
        if(!part.length)continue;
        const {data,error}=await state.client.from('students').select('national_id').eq('academic_year',year).in('national_id',part);
        if(error)throw error;(data||[]).forEach(r=>existing.add(String(r.national_id)));
      }
      const fresh=pending.rows.filter(r=>!existing.has(r.national_id));
      const skipped=pending.rows.length-fresh.length;
      if(!fresh.length){say('#admissionsExcelPreview','لم تُضف بيانات جديدة؛ جميع الأرقام القومية موجودة بالفعل في العام الدراسي '+esc(year)+'.','error');return;}
      let inserted=0;
      for(let i=0;i<fresh.length;i+=100){
        const batch=fresh.slice(i,i+100);
        const {error}=await state.client.from('students').insert(batch);
        if(error)throw new Error('تم حفظ '+inserted+' سجلًا قبل حدوث الخطأ: '+error.message);
        inserted+=batch.length;
      }
      say('#admissionsExcelPreview','تم استيراد '+inserted+' طالبة بنجاح. تم تخطي '+skipped+' طالبة مسجلة مسبقًا. الصفوف المستبعدة في المراجعة: '+pending.errors.length+'.','success');
      say('#admissionsSettingsMsg','اكتمل استيراد بيانات الطالبات من ملف Excel.','success');
      state.pendingAdmissionsImport=null;btn.disabled=true;$('#admissionsExcelFile').value='';
      await loadSection(state.section);await loadStats();
    }catch(err){say('#admissionsExcelPreview','تعذر إكمال الاستيراد: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=!state.pendingAdmissionsImport?.rows?.length;btn.textContent='استيراد الطالبات إلى المنظومة';}
  }

  async function getAdmissionsExportRows(){
    const year=$('#distAcademicYear')?.value||'2026/2027';
    const {data,error}=await state.client.from('students').select('*').eq('academic_year',year).order('total_score',{ascending:false}).limit(10000);
    if(error)throw error;
    return {year,rows:data||[]};
  }
  function admissionsExcelDownload(rows,sheetName,fileName){
    if(typeof XLSX==='undefined')throw new Error('مكتبة Excel غير متاحة. حدّث الصفحة وحاول مرة أخرى.');
    const ws=XLSX.utils.json_to_sheet(rows);ws['!views']=[{rightToLeft:true}];
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,sheetName.slice(0,31));XLSX.writeFile(wb,fileName);
  }
  async function exportAdmissionsStudents(){
    if(!admin())return;
    const btn=$('#exportAdmissionsStudents');btn.disabled=true;
    try{
      const {year,rows}=await getAdmissionsExportRows();
      if(!rows.length){say('#admissionsSettingsMsg','لا توجد بيانات طالبات للعام الدراسي المحدد.','error');return;}
      const fields=[['serial','مسلسل'],['full_name','اسم الطالبة'],['father_name','اسم الأب'],['national_id','الرقم القومي'],['birth_date','تاريخ الميلاد'],['age_at_october','السن في أول أكتوبر'],['total_score','المجموع'],['preparatory_school','المدرسة الإعدادية'],['guardian_job','وظيفة ولي الأمر'],['guardian_phone','تليفون ولي الأمر'],['address','العنوان'],['academic_year','العام الدراسي'],['specialization','التخصص'],['section','الفصل'],['grade','الصف'],['student_code','كود الطالبة'],['enrollment_status','حالة القيد']];
      const out=rows.map((r,i)=>Object.fromEntries(fields.map(([k,label])=>[label,k==='serial'?i+1:(r[k]??'')])));
      admissionsExcelDownload(out,'بيانات الطالبات','بيانات_الطالبات_كاملة_'+year.replace('/','-')+'.xlsx');
      say('#admissionsSettingsMsg','تم استخراج شيت بيانات الطالبات ('+rows.length+' طالبة).','success');
    }catch(err){say('#admissionsSettingsMsg','تعذر استخراج البيانات: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=false;}
  }
  async function exportAdmissionsClassLists(){
    if(!admin())return;
    const btn=$('#exportAdmissionsClasses');btn.disabled=true;
    try{
      const {year,rows}=await getAdmissionsExportRows();
      const assigned=rows.filter(r=>r.specialization&&r.specialization!=='غير موزعة'&&r.section&&r.section!=='غير موزع');
      if(!assigned.length){say('#admissionsSettingsMsg','لا توجد طالبات موزعات لهذا العام الدراسي بعد.','error');return;}
      const wb=XLSX.utils.book_new();
      const groups=new Map();
      assigned.sort((a,b)=>String(a.specialization).localeCompare(String(b.specialization),'ar')||String(a.section).localeCompare(String(b.section),'ar')||Number(b.total_score||0)-Number(a.total_score||0));
      for(const r of assigned){const key=String(r.specialization)+' — '+String(r.section);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
      for(const [key,list] of groups){
        const out=list.map((r,i)=>({'مسلسل':i+1,'اسم الطالبة':r.full_name||'','الرقم القومي':r.national_id||'','المجموع':r.total_score??'','العام الدراسي':r.academic_year||year,'التخصص':r.specialization||'','الفصل':r.section||''}));
        const ws=XLSX.utils.json_to_sheet(out);ws['!views']=[{rightToLeft:true}];XLSX.utils.book_append_sheet(wb,ws,key.slice(0,31));
      }
      XLSX.writeFile(wb,'قوائم_الفصول_بعد_التوزيع_'+year.replace('/','-')+'.xlsx');
      say('#admissionsSettingsMsg','تم استخراج قوائم الفصول لعدد '+assigned.length+' طالبة في '+groups.size+' فصل.','success');
    }catch(err){say('#admissionsSettingsMsg','تعذر استخراج قوائم الفصول: '+(err?.message||String(err)),'error');}
    finally{btn.disabled=false;}
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
      if(result.codes?.length){
        if(typeof XLSX==='undefined')throw new Error('مكتبة Excel لم تُحمّل. حدّث الصفحة وحاول مرة أخرى.');
        const rows=result.codes.map((x,i)=>({'مسلسل':i+1,'الرقم القومي':x.national_id||'','رمز التفعيل':x.activation_code}));
        const sheet=XLSX.utils.json_to_sheet(rows,{header:['مسلسل','الرقم القومي','رمز التفعيل']});
        sheet['!cols']=[{wch:10},{wch:20},{wch:16}];
        const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,'رموز التفعيل');
        XLSX.writeFile(book,'رموز_تفعيل_الموظفين.xlsx');
        out.textContent='تم إصدار '+result.codes.length+' رمزًا وتنزيل ملف Excel. صلاحية الرموز 7 أيام، وكل رمز يُستخدم مرة واحدة. احفظ الملف في مكان آمن وسلّم كل رمز لصاحبه فقط.';
      }else{
        out.textContent='لا توجد حسابات جديدة جاهزة لإصدار رموز لها. أضف الأرقام القومية أولًا وتأكد أن الحسابات لم تُفعّل من قبل.';
      }
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
    if(sec.table==='students'){
      const id=String(data.national_id||'').trim();
      if(!/^\\d{14}$/.test(id)){say('#sectionMsg','يجب إدخال رقم قومي صحيح مكوّن من 14 رقمًا.','error');return;}
      const yy=Number(id.slice(1,3)),mm=Number(id.slice(3,5)),dd=Number(id.slice(5,7)),century=id[0]==='2'?1900:id[0]==='3'?2000:0;
      if(!century||mm<1||mm>12||dd<1||dd>31){say('#sectionMsg','الرقم القومي لا يحتوي على تاريخ ميلاد صالح.','error');return;}
      const d=new Date(century+yy,mm-1,dd);if(d.getFullYear()!==century+yy||d.getMonth()!==mm-1||d.getDate()!==dd){say('#sectionMsg','تاريخ الميلاد المستخرج من الرقم القومي غير صحيح.','error');return;}
      data.student_code='ADM-'+id;data.grade='الأول';data.specialization='غير موزعة';data.section='غير موزع';data.enrollment_status='مقيدة';
      data.father_name=data.father_name||((data.full_name||'').trim().split(/\\s+/)[1]||'');
      data.birth_date=(century+yy)+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
      const startYear=Number(String(data.academic_year||'2026/2027').split('/')[0]),birthDate=new Date(data.birth_date+'T00:00:00'),target=new Date(startYear,9,1);
      let months=(target.getFullYear()-birthDate.getFullYear())*12+target.getMonth()-birthDate.getMonth();if(target.getDate()<birthDate.getDate())months--;
      data.age_at_october=months>=0?Math.floor(months/12)+' سنة و'+(months%12)+' شهر':'تاريخ الميلاد بعد أول أكتوبر';
      if(data.total_score===undefined||data.total_score===null||data.total_score===''){say('#sectionMsg','أدخل مجموع الطالبة.','error');return;}
    }
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
