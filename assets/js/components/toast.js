function showToast(message, type="info", duration=3000){
  const existing = document.getElementById("cloudtokToast");
  if(existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "cloudtokToast";
  const colors = {info:"#00b7ff", error:"#fe2c55", success:"#00c853", warning:"#ff9800"};
  const bgColors = {info:"rgba(0,183,255,0.15)", error:"rgba(254,44,85,0.15)", success:"rgba(0,200,83,0.15)", warning:"rgba(255,152,0,0.15)"};
  const icons = {info:"ℹ️", error:"✕", success:"✓", warning:"⚠️"};
  
  toast.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:#1a1a1a;border:1px solid ${colors[type]}33;
    border-radius:12px;padding:12px 18px;display:flex;align-items:center;gap:10px;
    z-index:99999;max-width:90%;width:360px;box-shadow:0 8px 32px rgba(0,0,0,0.5);
    animation:toastSlideIn 0.3s ease;font-size:14px;color:#fff;
  `;
  
  toast.innerHTML = `
    <span style="width:24px;height:24px;border-radius:50%;background:${bgColors[type]};color:${colors[type]};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${icons[type]}</span>
    <span style="flex:1;">${message}</span>
  `;
  
  if(!document.getElementById("toastAnimStyle")){
    const style = document.createElement("style");
    style.id = "toastAnimStyle";
    style.textContent = "@keyframes toastSlideIn{from{opacity:0;transform:translateX(-50%) translateY(20px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}";
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(()=>{
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
    toast.style.transition = "opacity 0.3s, transform 0.3s";
    setTimeout(()=>toast.remove(), 300);
  }, duration);
}
window.showToast = showToast;
