/* ══════════════════════════════════════════════════════
   PALLEO SUITEX — app.js
   JSONP-based API (bypasses CORS on GAS)
══════════════════════════════════════════════════════ */

var API = 'https://script.google.com/macros/s/AKfycbwTe0chJSY72J9C4zr2ficwAam-M0PosXkIr32FIuInZ1cau3EhHSc9BBEF9w1T5g9IRg/exec';
var _U=null,_V=null,_ST=null,_D={},_sub={},_tt,_TOKEN=null;
var _cbIdx = 0;

/* ── API helper — JSONP (no CORS issues with GAS) ── */
function _api(action, data, ok, err) {
  var cbName = '_gcb' + (++_cbIdx);
  var timeout;

  window[cbName] = function(r) {
    clearTimeout(timeout);
    try { delete window[cbName]; } catch(e) { window[cbName] = undefined; }
    var el = document.getElementById('_jsonp_' + cbName);
    if (el) el.parentNode.removeChild(el);
    if (r && r.success === false && r.error === 'NOT_AUTHENTICATED') { _signOut(); return; }
    if (ok) ok(r);
  };

  timeout = setTimeout(function() {
    try { delete window[cbName]; } catch(e) { window[cbName] = undefined; }
    var el = document.getElementById('_jsonp_' + cbName);
    if (el) el.parentNode.removeChild(el);
    console.warn('[API timeout]', action);
    if (err) err({ message: 'Request timed out. Check internet connection.' });
  }, 20000);

  var payload = encodeURIComponent(JSON.stringify({
    action: action,
    data:   data || {},
    token:  _TOKEN || ''
  }));

  var url = API + '?callback=' + cbName + '&payload=' + payload;
  var script = document.createElement('script');
  script.id  = '_jsonp_' + cbName;
  script.src = url;
  script.onerror = function() {
    clearTimeout(timeout);
    try { delete window[cbName]; } catch(e) {}
    if (err) err({ message: 'Network error. Check connection.' });
  };
  document.head.appendChild(script);
}

/* ── LOGIN ── */
document.addEventListener('keypress',function(e){
  if(e.key==='Enter'&&document.getElementById('sLogin').style.display!=='none') _doLogin();
});

function _doLogin(){
  var em=document.getElementById('femail').value.trim();
  var pw=document.getElementById('fpass').value.trim();
  var errEl=document.getElementById('loginErr');
  errEl.textContent='';
  if(!em){errEl.textContent='Enter email address';return;}
  if(!pw){errEl.textContent='Enter password';return;}
  var btn=document.getElementById('btnLogin');
  btn.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Signing in...';
  btn.disabled=true;
  fetch(API,{method:'POST',body:JSON.stringify({action:'login',data:{email:em,password:pw}})})
    .then(function(r){return r.json();})
    .then(function(r){
      btn.innerHTML='Sign In';btn.disabled=false;
      if(r&&r.success){_U=r.user;_TOKEN=r.token;localStorage.setItem('px_token',_TOKEN);localStorage.setItem('px_user',JSON.stringify(_U));_initApp();}
      else errEl.textContent=(r&&r.error)||'Invalid credentials';
    })
    .catch(function(){btn.innerHTML='Sign In';btn.disabled=false;errEl.textContent='Connection error. Try again.';});
}

/* Auto-restore session */
window.addEventListener('DOMContentLoaded',function(){
  var t=localStorage.getItem('px_token'),u=localStorage.getItem('px_user');
  if(t&&u){try{_TOKEN=t;_U=JSON.parse(u);_initApp();}catch(e){localStorage.clear();}}
});

function _initApp(){
  document.getElementById('sLogin').style.display='none';
  document.getElementById('sApp').classList.add('on');
  var av=_U.name?_U.name[0].toUpperCase():'?';
  document.getElementById('sbAv').textContent=av;
  document.getElementById('sbName').textContent=_U.name;
  document.getElementById('sbRole').textContent=_roleLbl(_U.role);
  _buildNav();_buildBNav();
  _api('getAllData',{},function(r){_D=r.data||{};_goHome();},function(){_toast('⚠️ Data load error');_goHome();});
}
function _roleLbl(r){return{store:'Store User',production:'Production User',admin:'Admin — All Access'}[r]||r;}

/* ── NAV ── */
var _NV=[
  {v:'home',ic:'fa-home',lb:'Dashboard',ro:['store','production','admin']},
  {grp:'Store',ro:['store','admin']},
  {v:'rmIn',ic:'fa-truck-loading',lb:'RM Inward',ro:['store','admin']},
  {v:'rmOut',ic:'fa-dolly',lb:'RM Outward',ro:['store','admin']},
  {v:'rmStock',ic:'fa-warehouse',lb:'Live RM Stock',ro:['store','admin']},
  {grp:'Production',ro:['production','admin']},
  {v:'production',ic:'fa-industry',lb:'Production',ro:['production','admin']},
  {v:'fgStock',ic:'fa-boxes',lb:'Live FG Stock',ro:['production','admin']},
  {grp:'Sales',ro:['admin']},
  {v:'dispatch',ic:'fa-shipping-fast',lb:'Dispatch',ro:['admin']},
  {grp:'Masters',ro:['admin']},
  {v:'customers',ic:'fa-users',lb:'Customers',ro:['admin']},
  {v:'vendors',ic:'fa-store',lb:'Vendors',ro:['admin']},
  {v:'products',ic:'fa-box-open',lb:'Products & BOM',ro:['admin']},
  {v:'reorder',ic:'fa-bell',lb:'Re-order Alert',ro:['admin']}
];
function _buildNav(){
  var h='';
  _NV.forEach(function(it){
    if(!_cs(it.ro))return;
    if(it.grp){h+='<div class="nav-grp-lbl">'+it.grp+'</div>';return;}
    h+='<div class="nav-item" data-v="'+it.v+'" onclick="_lv(\''+it.v+'\')"><i class="fas '+it.ic+'"></i>'+it.lb+'</div>';
  });
  document.getElementById('sbNav').innerHTML=h;
}
function _buildBNav(){
  var items=[
    {v:'home',ic:'fa-home',lb:'Home',ro:['store','production','admin']},
    {v:'rmIn',ic:'fa-truck-loading',lb:'RM In',ro:['store','admin']},
    {v:'rmOut',ic:'fa-dolly',lb:'RM Out',ro:['store','admin']},
    {v:'production',ic:'fa-industry',lb:'Produce',ro:['production','admin']},
    {v:'dispatch',ic:'fa-shipping-fast',lb:'Dispatch',ro:['admin']}
  ];
  var h='';
  items.forEach(function(it){
    if(!_cs(it.ro))return;
    h+='<div class="bn-item" data-v="'+it.v+'" onclick="_lv(\''+it.v+'\')"><i class="fas '+it.ic+'"></i><span>'+it.lb+'</span></div>';
  });
  document.getElementById('bnav').innerHTML=h;
}
function _cs(roles){if(!roles||!roles.length)return true;return roles.indexOf(_U.role)>=0;}
function _san(v){
  document.querySelectorAll('.nav-item').forEach(function(el){el.classList.toggle('on',el.dataset.v===v);});
  document.querySelectorAll('.bn-item').forEach(function(el){el.classList.toggle('on',el.dataset.v===v);});
}

/* ── ROUTER ── */
var _titles={home:'Dashboard',rmIn:'RM Inward',rmOut:'RM Outward',rmStock:'Live RM Stock',production:'Production',fgStock:'Live FG Stock',dispatch:'Dispatch',customers:'Customers',vendors:'Vendors',products:'Products & BOM',reorder:'Re-order Alert'};
function _lv(name,tab){
  _V=name;_ST=tab||null;_san(name);_closeSb();
  document.getElementById('tbTitle').textContent=_titles[name]||name;
  document.getElementById('tbSub').textContent='';
  switch(name){
    case 'home':_vHome();break; case 'rmIn':_vRmIn();break; case 'rmOut':_vRmOut();break;
    case 'rmStock':_vRmStock();break; case 'production':_vProd();break; case 'fgStock':_vFg();break;
    case 'dispatch':_vDispatch();break; case 'customers':_vCustomers();break;
    case 'vendors':_vVendors();break; case 'products':_vProducts();break; case 'reorder':_vReorder();break;
    default:_sc('<div class="empty"><i class="fas fa-hard-hat"></i><p>Coming soon</p></div>');
  }
}
function _goHome(){_lv('home');}
function _sc(h){document.getElementById('content').innerHTML=h;}
function _refresh(){
  if(!_V)return;
  var ico=document.getElementById('refreshIco');ico.classList.add('fa-spin');
  _api('getAllData',{},function(r){_D=r.data||{};ico.classList.remove('fa-spin');var at=null;var tel=document.querySelector('.tab.on');if(tel)at=tel.dataset.tab;_lv(_V,at);},
  function(){ico.classList.remove('fa-spin');_toast('⚠️ Refresh failed');});
}

/* ── HOME ── */
function _vHome(){
  var role=_U.role;
  var h='<div style="margin-bottom:16px"><div style="font-size:19px;font-weight:700;color:var(--tx)">👋 '+_U.name+'</div><div style="font-size:12px;color:var(--tx3);margin-top:2px">'+_roleLbl(role)+'</div></div>';
  h+='<div class="kpi-row" id="kpiRow">';
  for(var i=0;i<4;i++)h+='<div class="kpi"><div class="sk skh" style="width:55%"></div><div class="sk skh" style="width:75%;height:20px"></div></div>';
  h+='</div>';
  var tiles=[
    {v:'rmIn',ic:'fa-truck-loading',n:'RM Inward',s:'Log incoming',c:'var(--G)',cb:'var(--Gl)',ro:['store','admin']},
    {v:'rmOut',ic:'fa-dolly',n:'RM Outward',s:'Issue to floor',c:'var(--O)',cb:'var(--Ol)',ro:['store','admin']},
    {v:'rmStock',ic:'fa-warehouse',n:'RM Stock',s:'Live stock',c:'var(--T)',cb:'var(--Tl)',ro:['store','admin']},
    {v:'production',ic:'fa-industry',n:'Production',s:'Orders & batches',c:'var(--A)',cb:'var(--Al)',ro:['production','admin']},
    {v:'fgStock',ic:'fa-boxes',n:'FG Stock',s:'Ready to ship',c:'var(--V)',cb:'var(--Vl)',ro:['production','admin']},
    {v:'dispatch',ic:'fa-shipping-fast',n:'Dispatch',s:'Ship to customers',c:'var(--P)',cb:'var(--Pl)',ro:['admin']},
    {v:'reorder',ic:'fa-bell',n:'Re-order',s:'Below alert',c:'var(--R)',cb:'var(--Rl)',ro:['admin']},
    {v:'customers',ic:'fa-users',n:'Customers',s:'Manage list',c:'var(--A)',cb:'var(--Al)',ro:['admin']},
    {v:'products',ic:'fa-box-open',n:'Products',s:'& BOM',c:'var(--O)',cb:'var(--Ol)',ro:['admin']}
  ];
  h+='<div class="home-grid">';
  tiles.forEach(function(t){
    if(!_cs(t.ro))return;
    h+='<div class="home-tile" style="--tc:'+t.c+';--tib:'+t.cb+'" onclick="_lv(\''+t.v+'\')">';
    h+='<div class="ht-ico"><i class="fas '+t.ic+'"></i></div><div class="ht-name">'+t.n+'</div><div class="ht-sub">'+t.s+'</div></div>';
  });
  h+='</div>';
  _sc(h);
  _api('getStats',{},function(r){
    var s=r.data||{};var kpis=[];
    if(role==='store'||role==='admin'){
      kpis.push(_kpi('fa-layer-group','var(--T)','var(--Tl)',s.rmTotal||0,'Total RMs'));
      kpis.push(_kpi('fa-exclamation-triangle','var(--R)','var(--Rl)',s.rmBelowAlert||0,'Below Alert'));
      kpis.push(_kpi('fa-arrow-down','var(--G)','var(--Gl)',s.inwardToday||0,"Today In"));
      kpis.push(_kpi('fa-arrow-up','var(--O)','var(--Ol)',s.outwardToday||0,"Today Out"));
    }else if(role==='production'){
      kpis.push(_kpi('fa-spinner','var(--A)','var(--Al)',s.ordersInProcess||0,'In Process'));
      kpis.push(_kpi('fa-check-circle','var(--G)','var(--Gl)',s.ordersComplete||0,'Completed'));
      kpis.push(_kpi('fa-boxes','var(--V)','var(--Vl)',s.fgProducts||0,'FG Products'));
      kpis.push(_kpi('fa-shipping-fast','var(--P)','var(--Pl)',s.dispatchToday||0,'Dispatched'));
    }else{
      kpis.push(_kpi('fa-layer-group','var(--T)','var(--Tl)',s.rmTotal||0,'Total RMs'));
      kpis.push(_kpi('fa-industry','var(--A)','var(--Al)',s.ordersInProcess||0,'In Process'));
      kpis.push(_kpi('fa-boxes','var(--V)','var(--Vl)',s.fgProducts||0,'FG Stock'));
      kpis.push(_kpi('fa-shipping-fast','var(--P)','var(--Pl)',s.dispatchToday||0,'Dispatched'));
    }
    var kr=document.getElementById('kpiRow');if(kr&&kpis.length)kr.innerHTML=kpis.join('');
  },function(){});
}
function _kpi(ic,c,cb,val,lbl){return'<div class="kpi" style="--kc:'+c+';--kib:'+cb+'"><div class="kpi-ico"><i class="fas '+ic+'"></i></div><div class="kpi-val">'+val+'</div><div class="kpi-lbl">'+lbl+'</div></div>';}

/* ── RM INWARD ── */
function _vRmIn(){
  var inwards=_D.inward||[];
  var h='<div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-plus-circle" style="color:var(--G)"></i> New Inward Entry</div></div><div class="card-body">';
  h+='<div class="fg"><label>Raw Material *</label><select id="inRm">'+_rmOpts()+'</select></div>';
  h+='<div class="form-row"><div class="fg"><label>Qty *</label><input type="number" id="inQty" placeholder="0" min="1" inputmode="numeric"></div>';
  h+='<div class="fg"><label>Date</label><input type="date" id="inDate" value="'+_today()+'"></div></div>';
  h+='<div class="fg"><label>Remark</label><input type="text" id="inRem" placeholder="Optional"></div>';
  h+='<button class="btn btnG btn-full" id="btnIS" onclick="_saveIn()"><i class="fas fa-save"></i> Save Inward</button></div></div>';
  var sorted=inwards.slice().sort(function(a,b){return new Date(b.Date||0)-new Date(a.Date||0);});
  h+='<div class="sec-hdr">Recent ('+sorted.length+')</div>';
  if(!sorted.length)h+='<div class="empty"><i class="fas fa-inbox"></i><p>No entries yet</p></div>';
  else{
    h+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>RM</th><th>Material</th><th class="td-r">Qty</th></tr></thead><tbody>';
    sorted.slice(0,40).forEach(function(r){
      var rm=_rmById(String(r['Product Name']||''));
      h+='<tr><td>'+_fd(r.Date)+'</td><td><span class="badge bt">'+r['Product Name']+'</span></td><td>'+(rm?rm.Material_Name:'—')+'</td><td class="td-r">'+_n(r['Total Qty'])+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
  }
  _sc(h);
}
function _saveIn(){
  if(!_ss('btnIS'))return;
  var rm=document.getElementById('inRm').value,qty=document.getElementById('inQty').value,date=document.getElementById('inDate').value,rem=document.getElementById('inRem').value;
  if(!rm){_toast('❌ Select RM');_se('btnIS');return;}
  if(!qty||Number(qty)<=0){_toast('❌ Enter valid qty');_se('btnIS');return;}
  _api('saveInward',{rmId:rm,qty:Number(qty),date:date,remark:rem},function(r){
    _se('btnIS');
    if(r&&r.success){_toast('✅ Inward saved');_api('getAllData',{},function(d){_D=d.data||{};_vRmIn();});}
    else _toast('❌ '+(r&&r.error||'Save failed'));
  },function(e){_se('btnIS');_toast('❌ Error');});
}

/* ── RM OUTWARD ── */
function _vRmOut(){
  var outwards=_D.outward||[];
  var h='<div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-arrow-up" style="color:var(--O)"></i> Issue RM Outward</div></div><div class="card-body">';
  h+='<div class="fg"><label>Raw Material *</label><select id="outRm">'+_rmOpts()+'</select></div>';
  h+='<div class="form-row"><div class="fg"><label>Qty *</label><input type="number" id="outQty" placeholder="0" min="1" inputmode="numeric"></div>';
  h+='<div class="fg"><label>Date</label><input type="date" id="outDate" value="'+_today()+'"></div></div>';
  h+='<div class="fg"><label>Linked Order</label><select id="outOrd"><option value="">— No Order —</option>'+_ordOpts()+'</select></div>';
  h+='<button class="btn btn-full" style="background:var(--O);color:#fff" id="btnOS" onclick="_saveOut()"><i class="fas fa-arrow-up"></i> Issue Outward</button></div></div>';
  var sorted=outwards.slice().sort(function(a,b){return new Date(b.Date||0)-new Date(a.Date||0);});
  h+='<div class="sec-hdr">Recent ('+sorted.length+')</div>';
  if(!sorted.length)h+='<div class="empty"><i class="fas fa-inbox"></i><p>No issues yet</p></div>';
  else{
    h+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>RM</th><th class="td-r">Qty</th><th>Order</th></tr></thead><tbody>';
    sorted.slice(0,40).forEach(function(r){
      h+='<tr><td>'+_fd(r.Date)+'</td><td><span class="badge bo">'+r.RM_ID+'</span></td><td class="td-r">'+_n(r['Qty Issued'])+'</td><td style="font-size:11px">'+(r['Order ID']||'—')+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
  }
  _sc(h);
}
function _saveOut(){
  if(!_ss('btnOS'))return;
  var rm=document.getElementById('outRm').value,qty=document.getElementById('outQty').value,ord=document.getElementById('outOrd').value,date=document.getElementById('outDate').value;
  if(!rm||!qty||Number(qty)<=0){_toast('❌ Fill required fields');_se('btnOS');return;}
  _api('saveOutward',{rmId:rm,qty:Number(qty),orderId:ord,date:date},function(r){
    _se('btnOS');
    if(r&&r.success){_toast('✅ Outward saved');_api('getAllData',{},function(d){_D=d.data||{};_vRmOut();});}
    else _toast('❌ '+(r&&r.error||'Failed'));
  },function(){_se('btnOS');_toast('❌ Error');});
}

/* ── LIVE RM STOCK ── */
function _vRmStock(){
  _sc('<div class="empty"><i class="fas fa-circle-notch fa-spin"></i><p>Loading stock...</p></div>');
  _api('getRMStock',{},function(r){
    var stock=r.data||[];
    var below=stock.filter(function(s){return s.isBelowAlert;});
    var h='';
    if(below.length)h+='<div class="alert-strip danger"><i class="fas fa-bell"></i> '+below.length+' items below alert — check Re-order</div>';
    h+='<div class="kpi-row">';
    h+=_kpi('fa-layer-group','var(--T)','var(--Tl)',stock.length,'Total RMs');
    h+=_kpi('fa-check','var(--G)','var(--Gl)',stock.length-below.length,'Adequate');
    h+=_kpi('fa-exclamation-triangle','var(--R)','var(--Rl)',below.length,'Low Stock');
    h+=_kpi('fa-arrow-down','var(--A)','var(--Al)',_n(stock.reduce(function(a,s){return a+s.inQty;},0)),'Total In');
    h+='</div>';
    h+='<div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-warehouse"></i> Live RM Stock</div></div>';
    h+='<div style="padding:10px 16px 0"><input type="text" id="rmS" placeholder="🔍 Search RM..." onkeyup="_filterRm()" style="width:100%;padding:10px 14px;border:1.5px solid var(--bdr);border-radius:8px;font-size:13px;background:var(--sur2);outline:none"></div>';
    h+='<div class="tbl-wrap" style="padding:8px 16px 16px"><table id="rmTbl"><thead><tr><th>RM ID</th><th>Material</th><th class="td-r">Live</th><th class="td-r">Alert</th><th>Status</th></tr></thead><tbody>';
    stock.forEach(function(s){
      var pct=s.alertLimit>0?Math.min(100,Math.round(s.live/s.alertLimit*100)):100;
      var fc=s.isBelowAlert?'var(--R)':(pct<60?'var(--O)':'var(--G)');
      h+='<tr><td><b style="font-size:11px">'+s.rmId+'</b></td><td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+s.name+'</td>';
      h+='<td class="td-r"><b style="color:'+(s.isBelowAlert?'var(--R)':'var(--tx)')+'">'+_n(s.live)+'</b><div class="sbar"><div class="sbar-fill" style="width:'+pct+'%;background:'+fc+'"></div></div></td>';
      h+='<td class="td-r" style="color:var(--tx3)">'+_n(s.alertLimit)+'</td>';
      h+='<td>'+(s.isBelowAlert?'<span class="badge br">Low</span>':'<span class="badge bg">OK</span>')+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
    _sc(h);
  },function(){_sc('<div class="empty"><i class="fas fa-exclamation-triangle"></i><p>Failed to load</p></div>');});
}
function _filterRm(){var q=document.getElementById('rmS').value.toLowerCase();document.querySelectorAll('#rmTbl tbody tr').forEach(function(tr){tr.style.display=tr.textContent.toLowerCase().indexOf(q)>=0?'':'none';});}

/* ── PRODUCTION ── */
function _vProd(){
  var prods=_D.production||[],logs=_D.productionLogs||[];
  var fgMap={};(_D.fgMovements||[]).forEach(function(m){var p=String(m['Product ID']||'');fgMap[p]=(fgMap[p]||0)+Number(m.Qty||0);});
  var h='<div class="tabs"><div class="tab on" data-tab="pl" onclick="_st(\'pl\')">Orders</div><div class="tab" data-tab="pn" onclick="_st(\'pn\')">+ New</div><div class="tab" data-tab="pg" onclick="_st(\'pg\')">Logs</div></div>';
  h+='<div class="tabpane on" data-pane="pl">';
  var active=prods.filter(function(p){return p['Order Status']!=='Complete'&&p['Order Status']!=='Discarded';});
  h+='<div style="display:flex;gap:10px;margin-bottom:14px"><div style="background:var(--Al);color:var(--A);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700">'+active.length+' Active</div><div style="background:var(--Gl);color:var(--G);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700">'+prods.filter(function(p){return p['Order Status']==='Complete';}).length+' Done</div></div>';
  if(!prods.length)h+='<div class="empty"><i class="fas fa-industry"></i><p>No orders yet</p></div>';
  else{
    var sorted=prods.slice().sort(function(a,b){return new Date(a.Deadline||0)-new Date(b.Deadline||0);});
    h+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Order ID</th><th>Company</th><th>Product</th><th class="td-r">Qty</th><th>FG</th><th>Status</th><th>Log</th></tr></thead><tbody>';
    sorted.forEach(function(p){
      var oid=String(p['Order ID']||''),pid=String(p['Product ID']||'');
      var prd=_prodById(pid),fg=fgMap[pid]||0;
      var st=String(p['Order Status']||'');
      var sb=st==='Complete'?'<span class="badge bg">Done</span>':st==='Discarded'?'<span class="badge bx">Discard</span>':st==='Partially Dispatched'?'<span class="badge bv">Part.</span>':'<span class="badge bb">Active</span>';
      var logBtn=st!=='Complete'&&st!=='Discarded'?'<button class="btn btn-sm btnA" data-oid="'+_esc(oid)+'" data-pid="'+_esc(pid)+'" data-cid="'+_esc(String(p['Company Name']||''))+'" onclick="_openLog(this)">+Log</button>':'—';
      h+='<tr><td style="font-size:10px"><b>'+oid.substring(0,8)+'</b></td><td>'+p['Company Name']+'</td><td style="font-size:11px">'+(prd?prd['Product Name']:pid)+'</td><td class="td-r">'+_n(p.Qty)+'</td><td class="td-r"><b>'+_n(fg)+'</b></td><td>'+sb+'</td><td>'+logBtn+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
  }
  h+='</div>';
  h+='<div class="tabpane" data-pane="pn"><div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-plus-circle"></i> New Order</div></div><div class="card-body">';
  h+='<div class="fg"><label>Customer *</label><select id="pCust" onchange="_fpp()">'+_cOpts()+'</select></div>';
  h+='<div class="fg"><label>Product *</label><select id="pProd">'+_pOpts()+'</select></div>';
  h+='<div class="form-row"><div class="fg"><label>Qty *</label><input type="number" id="pQty" placeholder="Total qty" min="1" inputmode="numeric"></div><div class="fg"><label>Priority</label><select id="pPri"><option>Medium</option><option>High</option><option>Low</option></select></div></div>';
  h+='<div class="fg"><label>Deadline</label><input type="date" id="pDl" value="'+_today()+'"></div>';
  h+='<div class="fg"><label>Remark</label><input type="text" id="pRem" placeholder="Optional"></div>';
  h+='<button class="btn btnP btn-full" id="btnPS" onclick="_saveProd()"><i class="fas fa-save"></i> Create Order</button></div></div></div>';
  h+='<div class="tabpane" data-pane="pg">';
  var ls=logs.slice().sort(function(a,b){return new Date(b['Log Date']||0)-new Date(a['Log Date']||0);});
  if(!ls.length)h+='<div class="empty"><i class="fas fa-clipboard-list"></i><p>No logs yet</p></div>';
  else{
    h+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Order</th><th class="td-r">Qty</th><th>Action</th></tr></thead><tbody>';
    ls.forEach(function(l){var a=String(l.Action||'');var ab=a==='Complete'?'<span class="badge bg">Done</span>':a==='Discard'?'<span class="badge br">Discard</span>':'<span class="badge bb">Continue</span>';h+='<tr><td>'+_fd(l['Log Date'])+'</td><td style="font-size:10px">'+String(l['Order ID']||'').substring(0,8)+'</td><td class="td-r"><b>'+_n(l['Qty Produced'])+'</b></td><td>'+ab+'</td></tr>';});
    h+='</tbody></table></div></div>';
  }
  h+='</div>';
  _sc(h);if(_ST)_st(_ST);
}
function _openLog(btn){
  var oid=btn.getAttribute('data-oid'),pid=btn.getAttribute('data-pid'),cid=btn.getAttribute('data-cid');
  var body='<div class="fg"><label>Qty Produced *</label><input type="number" id="lgQ" placeholder="Qty this batch" min="1" inputmode="numeric"></div>';
  body+='<div class="fg"><label>Action *</label><select id="lgA"><option>Continue</option><option>Complete</option><option>Discard</option></select></div>';
  body+='<div class="fg"><label>Remark</label><input type="text" id="lgR" placeholder="Optional"></div>';
  _om('Log: '+oid.substring(0,8),body,function(){
    var qty=document.getElementById('lgQ').value,act=document.getElementById('lgA').value,rem=document.getElementById('lgR').value;
    if(!qty||Number(qty)<=0){_toast('❌ Enter valid qty');return;}
    _cm();
    _api('saveProdLog',{orderId:oid,productId:pid,customerId:cid,qtyProduced:Number(qty),action:act,remark:rem},function(r){
      if(r&&r.success){_toast('✅ Log saved');_api('getAllData',{},function(d){_D=d.data||{};_vProd();});}
      else _toast('❌ '+(r&&r.error||'Failed'));
    },function(){_toast('❌ Error');});
  },'Save Log');
}
function _saveProd(){
  if(!_ss('btnPS'))return;
  var cust=document.getElementById('pCust').value,prod=document.getElementById('pProd').value,qty=document.getElementById('pQty').value;
  if(!cust||!prod||!qty||Number(qty)<=0){_toast('❌ Fill required fields');_se('btnPS');return;}
  _api('saveProduction',{company:cust,productId:prod,qty:Number(qty),priority:document.getElementById('pPri').value,deadline:document.getElementById('pDl').value,remark:document.getElementById('pRem').value},function(r){
    _se('btnPS');
    if(r&&r.success){_toast('✅ Order: '+r.orderId);_api('getAllData',{},function(d){_D=d.data||{};_vProd();});}
    else _toast('❌ '+(r&&r.error||'Failed'));
  },function(){_se('btnPS');_toast('❌ Error');});
}

/* ── FG STOCK ── */
function _vFg(){
  _sc('<div class="empty"><i class="fas fa-circle-notch fa-spin"></i><p>Loading FG stock...</p></div>');
  _api('getFGStock',{},function(r){
    var stock=r.data||[];var total=stock.reduce(function(a,s){return a+s.liveStock;},0);
    var h='<div class="kpi-row">';
    h+=_kpi('fa-boxes','var(--V)','var(--Vl)',stock.length,'Products');
    h+=_kpi('fa-cubes','var(--A)','var(--Al)',_n(total),'Total Units');
    h+=_kpi('fa-check-double','var(--G)','var(--Gl)',stock.filter(function(s){return s.liveStock>0;}).length,'Ready');
    h+=_kpi('fa-shipping-fast','var(--O)','var(--Ol)','—','Shipped Today');
    h+='</div>';
    if(!stock.length)h+='<div class="alert-strip info"><i class="fas fa-info-circle"></i> No FG stock yet. Mark production as Complete.</div>';
    else{
      h+='<div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-boxes"></i> Finished Goods (Live)</div></div>';
      h+='<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Customer</th><th class="td-r">FG Stock</th><th>Status</th></tr></thead><tbody>';
      stock.forEach(function(s){h+='<tr><td><b style="font-size:11px">'+s.productId+'</b><div style="font-size:11px;color:var(--tx2)">'+s.productName+'</div></td><td>'+s.customerId+'</td><td class="td-r"><b style="font-size:16px">'+_n(s.liveStock)+'</b></td><td>'+(s.liveStock>0?'<span class="badge bg">Ready</span>':'<span class="badge bx">Empty</span>')+'</td></tr>';});
      h+='</tbody></table></div></div>';
    }
    _sc(h);
  },function(){_sc('<div class="empty"><i class="fas fa-exclamation-triangle"></i><p>Failed</p></div>');});
}

/* ── DISPATCH ── */
function _vDispatch(){
  var dispatches=_D.dispatch||[],prods=_D.production||[];
  var fgMap={};(_D.fgMovements||[]).forEach(function(m){var p=String(m['Product ID']||'');fgMap[p]=(fgMap[p]||0)+Number(m.Qty||0);});
  var h='<div class="tabs"><div class="tab on" data-tab="dl" onclick="_st(\'dl\')">Dispatches</div><div class="tab" data-tab="dn" onclick="_st(\'dn\')">+ New</div></div>';
  h+='<div class="tabpane on" data-pane="dl">';
  if(!dispatches.length)h+='<div class="empty"><i class="fas fa-shipping-fast"></i><p>No dispatches yet</p></div>';
  else{
    var sorted=dispatches.slice().sort(function(a,b){return new Date(b['Dispatch Date']||0)-new Date(a['Dispatch Date']||0);});
    h+='<div class="card"><div class="tbl-wrap"><table><thead><tr><th>ID</th><th>Customer</th><th>Product</th><th class="td-r">Qty</th><th>Date</th></tr></thead><tbody>';
    sorted.forEach(function(d){var prd=_prodById(String(d['Product ID']||''));h+='<tr><td style="font-size:10px"><b>'+String(d['Dispatch ID']||'').substring(0,8)+'</b></td><td>'+d['Customer ID']+'</td><td style="font-size:11px">'+(prd?prd['Product Name']:d['Product ID'])+'</td><td class="td-r">'+_n(d.Qty)+'</td><td>'+_fd(d['Dispatch Date'])+'</td></tr>';});
    h+='</tbody></table></div></div>';
  }
  h+='</div>';
  h+='<div class="tabpane" data-pane="dn"><div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-shipping-fast"></i> Create Dispatch</div></div><div class="card-body">';
  h+='<div id="fgInfo" style="display:none" class="alert-strip ok"><i class="fas fa-boxes"></i> <span id="fgTxt"></span></div>';
  h+='<div class="fg"><label>Customer *</label><select id="dCust">'+_cOpts()+'</select></div>';
  h+='<div class="fg"><label>Product *</label><select id="dProd" onchange="_onDProd()">'+_pOpts()+'</select></div>';
  h+='<div class="fg"><label>Linked Order</label><select id="dOrd"><option value="">— No Order —</option>'+_aOrdOpts(prods)+'</select></div>';
  h+='<div class="form-row"><div class="fg"><label>Qty *</label><input type="number" id="dQty" placeholder="0" min="1" inputmode="numeric"></div><div class="fg"><label>Date</label><input type="date" id="dDate" value="'+_today()+'"></div></div>';
  h+='<div class="fg"><label>Note</label><input type="text" id="dNote" placeholder="Optional"></div>';
  h+='<button class="btn btnP btn-full" id="btnDS" onclick="_saveDisp()"><i class="fas fa-shipping-fast"></i> Create Dispatch</button></div></div></div>';
  _sc(h);if(_ST)_st(_ST);setTimeout(_onDProd,100);
}
function _onDProd(){
  var el=document.getElementById('dProd');if(!el)return;
  var fgMap={};(_D.fgMovements||[]).forEach(function(m){var p=String(m['Product ID']||'');fgMap[p]=(fgMap[p]||0)+Number(m.Qty||0);});
  var av=fgMap[el.value]||0;var info=document.getElementById('fgInfo'),txt=document.getElementById('fgTxt');
  if(info&&txt){txt.textContent='FG available: '+_n(av)+' units';info.style.display='flex';info.className='alert-strip '+(av>0?'ok':'danger');}
}
function _saveDisp(){
  if(!_ss('btnDS'))return;
  var cust=document.getElementById('dCust').value,prod=document.getElementById('dProd').value,ord=document.getElementById('dOrd').value,qty=document.getElementById('dQty').value,date=document.getElementById('dDate').value,note=document.getElementById('dNote').value;
  if(!cust||!prod||!qty||Number(qty)<=0){_toast('❌ Fill required fields');_se('btnDS');return;}
  _api('saveDispatch',{customerId:cust,productId:prod,orderId:ord,qty:Number(qty),date:date,note:note},function(r){
    _se('btnDS');
    if(r&&r.success){_toast('✅ Dispatch: '+r.dispatchId);_api('getAllData',{},function(d){_D=d.data||{};_vDispatch();});}
    else _toast('❌ '+(r&&r.error||'Failed'));
  },function(){_se('btnDS');_toast('❌ Error');});
}

/* ── REORDER ── */
function _vReorder(){
  _sc('<div class="empty"><i class="fas fa-circle-notch fa-spin"></i><p>Loading...</p></div>');
  _api('getReorder',{},function(r){
    var items=r.data||[];
    if(!items.length){_sc('<div class="alert-strip ok" style="margin:0"><i class="fas fa-check-circle"></i> All RMs above alert. No re-orders needed.</div>');return;}
    var h='<div class="alert-strip danger"><i class="fas fa-bell"></i> <b>'+items.length+' items</b> below alert limit</div>';
    h+='<div class="kpi-row">';var vMap={};items.forEach(function(i){vMap[i.vendorId||'?']=true;});
    h+=_kpi('fa-exclamation-triangle','var(--R)','var(--Rl)',items.length,'To Reorder');
    h+=_kpi('fa-store','var(--O)','var(--Ol)',Object.keys(vMap).length,'Vendors');
    h+=_kpi('fa-boxes','var(--A)','var(--Al)',_n(items.reduce(function(a,i){return a+i.shortBy;},0)),'Short');
    h+=_kpi('fa-clock','var(--V)','var(--Vl)','8 PM','Daily Email');
    h+='</div>';
    var grp={};items.forEach(function(i){var vk=i.vendorId||'?';if(!grp[vk])grp[vk]={name:i.vendorName,phone:i.vendorPhone,items:[]};grp[vk].items.push(i);});
    for(var vk in grp){
      var g=grp[vk];
      h+='<div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-store"></i> '+g.name+'</div>';
      if(g.phone)h+='<span style="font-size:12px;color:var(--tx2)">📞 '+g.phone+'</span>';
      h+='</div><div class="tbl-wrap"><table><thead><tr><th>RM</th><th>Material</th><th class="td-r">Stock</th><th class="td-r">Alert</th><th class="td-r" style="color:var(--R)">Short</th></tr></thead><tbody>';
      g.items.forEach(function(it){h+='<tr><td><b style="font-size:11px">'+it.rmId+'</b></td><td style="font-size:12px">'+it.name+'</td><td class="td-r" style="color:var(--R)"><b>'+_n(it.live)+'</b></td><td class="td-r">'+_n(it.alertLimit)+'</td><td class="td-r" style="color:var(--R);font-weight:700">'+_n(it.shortBy)+'</td></tr>';});
      h+='</tbody></table></div></div>';
    }
    _sc(h);
  },function(){_sc('<div class="empty"><i class="fas fa-exclamation-triangle"></i><p>Failed</p></div>');});
}

/* ── CUSTOMERS / VENDORS / PRODUCTS ── */
function _vCustomers(){
  var cs=_D.customers||[];
  var h='<div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-users"></i> Customers ('+cs.length+')</div><button class="btn btn-sm btnP" onclick="_addCust()"><i class="fas fa-plus"></i> Add</button></div>';
  if(!cs.length)h+='<div class="card-body"><div class="empty" style="padding:30px"><i class="fas fa-users"></i><p>No customers</p></div></div>';
  else{h+='<div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>City</th></tr></thead><tbody>';cs.forEach(function(c){h+='<tr><td><b>'+c.Name+'</b></td><td style="font-size:12px">'+(c['Contact Name']||'—')+'</td><td style="font-size:12px">'+(c.Phone||'—')+'</td><td>'+(c.City||'—')+'</td></tr>';});h+='</tbody></table></div>';}
  h+='</div>';_sc(h);
}
function _addCust(){
  var b='<div class="fg"><label>Name *</label><input type="text" id="acN" placeholder="Company name"></div><div class="form-row"><div class="fg"><label>Contact</label><input type="text" id="acC"></div><div class="fg"><label>Phone</label><input type="tel" id="acP"></div></div><div class="form-row"><div class="fg"><label>City</label><input type="text" id="acCt"></div><div class="fg"><label>GSTIN</label><input type="text" id="acG"></div></div>';
  _om('Add Customer',b,function(){var name=document.getElementById('acN').value.trim();if(!name){_toast('❌ Name required');return;}_cm();_api('saveCustomer',{name:name,contactName:document.getElementById('acC').value,phone:document.getElementById('acP').value,city:document.getElementById('acCt').value,gstin:document.getElementById('acG').value},function(r){if(r&&r.success){_toast('✅ Customer added');_api('getAllData',{},function(d){_D=d.data||{};_vCustomers();});}else _toast('❌ '+(r&&r.error||''));});},'Save');
}
function _vVendors(){
  var vs=_D.vendors||[];
  var h='<div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-store"></i> Vendors ('+vs.length+')</div><button class="btn btn-sm btnP" onclick="_addVend()"><i class="fas fa-plus"></i> Add</button></div>';
  if(!vs.length)h+='<div class="card-body"><div class="empty" style="padding:30px"><i class="fas fa-store"></i><p>No vendors</p></div></div>';
  else{h+='<div class="tbl-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>City</th></tr></thead><tbody>';vs.forEach(function(v){h+='<tr><td style="font-size:10px"><b>'+v.ID+'</b></td><td>'+v.Name+'</td><td style="font-size:12px">'+(v.Phone||'—')+'</td><td>'+(v.City||'—')+'</td></tr>';});h+='</tbody></table></div>';}
  h+='</div>';_sc(h);
}
function _addVend(){
  var b='<div class="fg"><label>Name *</label><input type="text" id="avN" placeholder="Vendor name"></div><div class="form-row"><div class="fg"><label>Phone</label><input type="tel" id="avP"></div><div class="fg"><label>City</label><input type="text" id="avCt"></div></div><div class="fg"><label>GSTIN</label><input type="text" id="avG"></div>';
  _om('Add Vendor',b,function(){var name=document.getElementById('avN').value.trim();if(!name){_toast('❌ Name required');return;}_cm();_api('saveVendor',{name:name,phone:document.getElementById('avP').value,city:document.getElementById('avCt').value,gstin:document.getElementById('avG').value},function(r){if(r&&r.success){_toast('✅ Vendor added');_api('getAllData',{},function(d){_D=d.data||{};_vVendors();});}else _toast('❌ '+(r&&r.error||''));});},'Save');
}
function _vProducts(){
  var prods=_D.productMaster||[],bom=_D.bom||[];
  var h='<div class="tabs"><div class="tab on" data-tab="prL" onclick="_st(\'prL\')">Products ('+prods.length+')</div><div class="tab" data-tab="prB" onclick="_st(\'prB\')">BOM ('+bom.length+')</div></div>';
  h+='<div class="tabpane on" data-pane="prL"><div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-box-open"></i> Products</div><button class="btn btn-sm btnP" onclick="_addProd()"><i class="fas fa-plus"></i></button></div>';
  if(!prods.length)h+='<div class="card-body"><div class="empty" style="padding:30px"><i class="fas fa-box-open"></i><p>No products</p></div></div>';
  else{h+='<div class="tbl-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Customer</th></tr></thead><tbody>';prods.forEach(function(p){h+='<tr><td style="font-size:11px"><b>'+p['Product ID']+'</b></td><td>'+p['Product Name']+'</td><td>'+p['Customer ID']+'</td></tr>';});h+='</tbody></table></div>';}
  h+='</div></div>';
  h+='<div class="tabpane" data-pane="prB"><div class="card"><div class="card-head"><div class="card-title"><i class="fas fa-sitemap"></i> BOM</div></div>';
  if(!bom.length)h+='<div class="card-body"><div class="empty" style="padding:30px"><i class="fas fa-sitemap"></i><p>No BOM</p></div></div>';
  else{h+='<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>RM</th><th class="td-r">Qty/Unit</th></tr></thead><tbody>';bom.forEach(function(b){h+='<tr><td style="font-size:11px">'+b['Product ID']+'</td><td style="font-size:11px">'+b['RM ID']+'</td><td class="td-r">'+b['Qty Per Unit']+'</td></tr>';});h+='</tbody></table></div>';}
  h+='</div></div>';
  _sc(h);if(_ST)_st(_ST);
}
function _addProd(){
  var b='<div class="fg"><label>Product ID *</label><input type="text" id="apI" placeholder="e.g. PROD099"></div><div class="fg"><label>Customer *</label><select id="apC">'+_cOpts()+'</select></div><div class="fg"><label>Product Name *</label><input type="text" id="apN"></div>';
  _om('Add Product',b,function(){var id=document.getElementById('apI').value.trim(),nm=document.getElementById('apN').value.trim(),ct=document.getElementById('apC').value;if(!id||!nm||!ct){_toast('❌ All fields required');return;}_cm();_api('saveProduct',{productId:id,productName:nm,customerId:ct},function(r){if(r&&r.success){_toast('✅ Product added');_api('getAllData',{},function(d){_D=d.data||{};_vProducts();});}else _toast('❌ '+(r&&r.error||''));});},'Save');
}

/* ── HELPERS ── */
function _rmOpts(){return'<option value="">— Select RM —</option>'+(_D.rawMaterials||[]).map(function(r){return'<option value="'+r.RM_ID+'">'+r.RM_ID+' — '+r.Material_Name+'</option>';}).join('');}
function _rmById(id){return(_D.rawMaterials||[]).find(function(r){return r.RM_ID===id;})||null;}
function _cOpts(){return'<option value="">— Select Customer —</option>'+(_D.customers||[]).map(function(c){return'<option value="'+c.Name+'">'+c.Name+'</option>';}).join('');}
function _pOpts(){return'<option value="">— Select Product —</option>'+(_D.productMaster||[]).map(function(p){return'<option value="'+p['Product ID']+'">'+p['Product ID']+' — '+p['Product Name']+'</option>';}).join('');}
function _prodById(id){return(_D.productMaster||[]).find(function(p){return p['Product ID']===id;})||null;}
function _ordOpts(){return(_D.production||[]).filter(function(p){return p['Order Status']!=='Complete'&&p['Order Status']!=='Discarded';}).map(function(p){return'<option value="'+p['Order ID']+'">'+p['Order ID']+'</option>';}).join('');}
function _aOrdOpts(prods){return(prods||[]).filter(function(p){return p['Order Status']!=='Complete'&&p['Order Status']!=='Discarded';}).map(function(p){return'<option value="'+p['Order ID']+'">'+p['Order ID']+' — '+p['Company Name']+'</option>';}).join('');}
function _fpp(){var c=document.getElementById('pCust'),p=document.getElementById('pProd');if(!c||!p)return;var cv=c.value;var f=(_D.productMaster||[]).filter(function(pr){return!cv||pr['Customer ID']===cv;});p.innerHTML='<option value="">— Select Product —</option>'+f.map(function(pr){return'<option value="'+pr['Product ID']+'">'+pr['Product ID']+' — '+pr['Product Name']+'</option>';}).join('');}
function _n(v){return Number(v||0).toLocaleString('en-IN');}
function _fd(d){if(!d)return'—';var dt=d instanceof Date?d:new Date(d);if(isNaN(dt))return String(d).substring(0,10);return dt.getDate()+'/'+(dt.getMonth()+1)+'/'+dt.getFullYear();}
function _today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function _esc(s){return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

/* ── MODAL ── */
function _om(title,bodyHtml,onConfirm,confirmLabel){
  document.getElementById('mtit').textContent=title;
  document.getElementById('mbody').innerHTML=bodyHtml;
  var ft=document.getElementById('mfoot');
  if(onConfirm){ft.style.display='flex';ft.innerHTML='<button class="btn btnO" style="flex:1" onclick="_cm()">Cancel</button><button class="btn btnP" style="flex:1" onclick="__mc()"><i class="fas fa-check"></i> '+(confirmLabel||'Confirm')+'</button>';window.__mc=onConfirm;}
  else ft.style.display='none';
  document.getElementById('mOv').classList.add('on');
  var m=document.getElementById('modal');m.style.display='flex';
  requestAnimationFrame(function(){m.classList.add('on');});
}
function _cm(){document.getElementById('mOv').classList.remove('on');var m=document.getElementById('modal');m.classList.remove('on');setTimeout(function(){m.style.display='none';},300);}
function _openModal(t,b,ok,lb){_om(t,b,ok,lb);}
function _closeModal(){_cm();}

/* ── TOAST ── */
function _toast(msg){var el=document.getElementById('toast');el.textContent=msg;el.classList.add('on');clearTimeout(_tt);_tt=setTimeout(function(){el.classList.remove('on');},2800);}

/* ── TABS ── */
function _st(id){_ST=id;document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',t.dataset.tab===id);});document.querySelectorAll('.tabpane').forEach(function(p){p.classList.toggle('on',p.dataset.pane===id);});}

/* ── SIDEBAR ── */
function _toggleSb(){var sb=document.getElementById('sb'),ov=document.getElementById('sbOv');var open=sb.classList.toggle('open');ov.classList.toggle('on',open);}
function _closeSb(){document.getElementById('sb').classList.remove('open');document.getElementById('sbOv').classList.remove('on');}

/* ── SIGN OUT ── */
function _showSignout(){document.getElementById('soOv').classList.add('on');}
function _closeSignout(){document.getElementById('soOv').classList.remove('on');}
function _signOut(){_U=null;_D={};_V=null;_TOKEN=null;localStorage.clear();document.getElementById('soOv').classList.remove('on');document.getElementById('sApp').classList.remove('on');document.getElementById('sLogin').style.display='flex';document.getElementById('femail').value='';document.getElementById('fpass').value='';document.getElementById('loginErr').textContent='';}

/* ── FORM GUARDS ── */
function _ss(btnId){if(_sub[btnId])return false;_sub[btnId]=true;var b=document.getElementById(btnId);if(b){b._orig=b.innerHTML;b.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Saving...';b.style.opacity='.7';b.style.pointerEvents='none';}return true;}
function _se(btnId){_sub[btnId]=false;var b=document.getElementById(btnId);if(b&&b._orig){b.innerHTML=b._orig;b.style.opacity='';b.style.pointerEvents='';}}
