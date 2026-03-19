let lineChart=null, pieChart=null, barChart=null;
let map=null;

// بيانات تقريبية واقعية 27 محافظة 2021-2030 مع الإحداثيات
const cities=[
  {name:"Cairo",lat:30.0444,lng:31.2357},
  {name:"Alex",lat:31.2001,lng:29.9187},
  {name:"Giza",lat:30.0131,lng:31.2089},
  {name:"Qalyubia",lat:30.1700,lng:31.2050},
  {name:"Dakahlia",lat:31.0534,lng:31.3804},
  {name:"RedSea",lat:27.2576,lng:33.8116},
  {name:"Beheira",lat:31.4167,lng:30.9167},
  {name:"Fayoum",lat:29.3100,lng:30.8400},
  {name:"Gharbia",lat:30.8750,lng:31.0333},
  {name:"Ismailia",lat:30.5965,lng:32.2715},
  {name:"Menofia",lat:30.4650,lng:30.9683},
  {name:"Minya",lat:28.0994,lng:30.7508},
  {name:"Qena",lat:26.1641,lng:32.7167},
  {name:"Sohag",lat:26.5561,lng:31.6949},
  {name:"Luxor",lat:25.6872,lng:32.6396},
  {name:"Aswan",lat:24.0900,lng:32.8998},
  {name:"RedSea",lat:27.2576,lng:33.8116},
  {name:"NewCapital",lat:30.1225,lng:31.4146},
  {name:"Helwan",lat:29.8579,lng:31.3081},
  {name:"Matrouh",lat:31.3544,lng:27.2243},
  {name:"Sharqia",lat:30.5833,lng:31.4667},
  {name:"Damietta",lat:31.4167,lng:31.8167},
  {name:"Suez",lat:29.9668,lng:32.5498},
  {name:"KafrElSheikh",lat:31.1089,lng:30.9397},
  {name:"Asyut",lat:27.1860,lng:31.1833},
  {name:"BeniSuef",lat:29.0667,lng:31.1000},
  {name:"Monufia",lat:30.4560,lng:30.9900},
];

// توليد بيانات سنوية تقريبية
let rawData=[];
cities.forEach(city=>{
  for(let year=2021;year<=2030;year++){
    let base=Math.floor(Math.random()*20000)+8000; // سعر تقريبي
    let tx=Math.floor(Math.random()*2000)+300; // معاملات تقريبي
    rawData.push({city:city.name,year,avgPrice:base,totalTx:tx,lat:city.lat,lng:city.lng});
  }
});

// إضافة المحافظات للـ Navbar
const cityMenu=document.getElementById('cityMenu');
cities.forEach(c=>{
  const li=document.createElement('li');
  li.innerHTML=`<a class="dropdown-item city-item" href="#" data-city="${c.name}">${c.name}</a>`;
  cityMenu.appendChild(li);
});

// hidden input لتخزين المدينة المختارة
const cityFilterInput=document.createElement('input');
cityFilterInput.type='hidden';
cityFilterInput.id='cityFilter';
cityFilterInput.value='all';
document.body.appendChild(cityFilterInput);

// تحديث Dashboard
function updateDashboard(){
  const selCity=document.getElementById('cityFilter').value;
  const selYear=document.getElementById('yearFilter').value;

  let filtered=rawData;
  if(selCity!=='all') filtered=filtered.filter(d=>d.city===selCity);
  if(selYear!=='all') filtered=filtered.filter(d=>d.year==selYear);

  const avgPrice=Math.round(filtered.reduce((a,c)=>a+c.avgPrice,0)/filtered.length || 0);
  const totalTx=filtered.reduce((a,c)=>a+c.totalTx,0)||0;
  const growth=filtered.length>1?Math.round((filtered[filtered.length-1].avgPrice - filtered[0].avgPrice)/filtered[0].avgPrice*100):0;
  const cityCounts={}; filtered.forEach(d=>cityCounts[d.city]=(cityCounts[d.city]||0)+1);
  const mShare=selCity==='all'?0:Math.round(cityCounts[selCity]/filtered.length*100);

  document.getElementById('avgPrice').innerText=avgPrice;
  document.getElementById('totalTx').innerText=totalTx;
  document.getElementById('growth').innerText=growth+'%';
  document.getElementById('mShare').innerText=mShare+'%';

  const years=[...new Set(filtered.map(d=>d.year))].sort();
  const avgPrices=years.map(y=>{
    const arr=filtered.filter(d=>d.year===y).map(d=>d.avgPrice);
    return Math.round(arr.reduce((a,c)=>a+c,0)/arr.length);
  });

  if(lineChart) lineChart.destroy();
  lineChart=new Chart(document.getElementById('forecastChart'),{
    type:'line',
    data:{labels:years,datasets:[{label:'Avg Price',data:avgPrices,borderColor:'#1e90ff',fill:true}]},
    options:{responsive:true,maintainAspectRatio:false}
  });

  const citiesSet=[...new Set(filtered.map(d=>d.city))];
  const cityValues=citiesSet.map(c=>filtered.filter(d=>d.city===c).length);
  if(pieChart) pieChart.destroy();
  pieChart=new Chart(document.getElementById('pieChart'),{
    type:'doughnut',
    data:{labels:citiesSet,datasets:[{data:cityValues}]},
    options:{responsive:true,maintainAspectRatio:false}
  });

  const barValues=citiesSet.map(c=>filtered.filter(d=>d.city===c).reduce((a,curr)=>a+curr.totalTx,0));
  if(barChart) barChart.destroy();
  barChart=new Chart(document.getElementById('barChart'),{
    type:'bar',
    data:{labels:citiesSet,datasets:[{label:'Total Transactions',data:barValues,backgroundColor:'#1e90ff'}]},
    options:{responsive:true,maintainAspectRatio:false}
  });

  if(!map){
    map=L.map('map').setView([30.0444,31.2357],6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  }
  map.eachLayer(l=>{if(l instanceof L.Marker) map.removeLayer(l)});
  filtered.forEach(d=>{
    L.marker([d.lat,d.lng]).addTo(map).bindPopup(`<b>${d.city}</b><br>Avg Price: ${d.avgPrice}<br>Total Tx: ${d.totalTx}`);
  });
}

// ربط Dropdown Navbar
document.querySelectorAll('.city-item').forEach(el=>{
  el.addEventListener('click', e=>{
    e.preventDefault();
    const city = e.target.dataset.city;
    document.getElementById('cityDropdown').innerText = e.target.innerText;
    document.getElementById('cityFilter').value = city;
    updateDashboard();
  });
});

document.getElementById('yearFilter').onchange=updateDashboard;

// عرض البيانات عند البداية
updateDashboard();