(function() {
  var ONBOARDING_KEY = "CloudTokOnboarding";

  function getOnboardingState() {
    try {
      var s = localStorage.getItem(ONBOARDING_KEY);
      return s ? JSON.parse(s) : { completed: false, tipsSeen: {}, tourStep: 0 };
    } catch (e) { return { completed: false, tipsSeen: {}, tourStep: 0 }; }
  }

  function saveOnboardingState(state) {
    try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function createWelcomeModal() {
    if (document.getElementById("onboardingModal")) return;
    var state = getOnboardingState();
    if (state.completed) return;
    if (!localStorage.getItem("CloudTokToken")) return;

    var modal = document.createElement("div");
    modal.id = "onboardingModal";
    modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);";

    var steps = [
      { icon: "🎬", title: "Welcome to CloudTok!", desc: "Discover short videos from creators around the world. Swipe up to see the next video!" },
      { icon: "❤️", title: "Like & Save", desc: "Double-tap any video to like it. Tap the bookmark icon to save videos for later." },
      { icon: "📤", title: "Upload Videos", desc: "Share your own videos! Tap the + button in the bottom nav to upload." },
      { icon: "💬", title: "Comment & Connect", desc: "Leave comments, follow creators, and send messages to connect with others." },
      { icon: "📡", title: "Go Live", desc: "Start a live stream and interact with your audience in real-time!" }
    ];

    var currentStep = 0;

    function renderStep() {
      var s = steps[currentStep];
      var isLast = currentStep === steps.length - 1;
      modal.innerHTML = '<div style="background:#111;border-radius:20px;padding:40px;max-width:400px;width:90%;text-align:center;position:relative;">' +
        '<div style="position:absolute;top:16px;right:16px;background:none;border:none;color:#888;font-size:20px;cursor:pointer;" id="onbClose">✕</div>' +
        '<div style="font-size:48px;margin-bottom:16px;">' + s.icon + '</div>' +
        '<h2 style="color:#fff;font-size:22px;margin-bottom:12px;">' + s.title + '</h2>' +
        '<p style="color:rgba(255,255,255,.6);font-size:14px;line-height:1.6;margin-bottom:24px;">' + s.desc + '</p>' +
        '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:24px;">' +
        steps.map(function(_, i) {
          return '<div style="width:8px;height:8px;border-radius:50%;background:' + (i === currentStep ? '#00b7ff' : 'rgba(255,255,255,.2)') + ';transition:background .2s;"></div>';
        }).join("") +
        '</div>' +
        '<div style="display:flex;gap:12px;">' +
        (currentStep > 0 ? '<button data-action="prev" style="flex:1;padding:14px;border:1px solid #333;background:none;color:#888;border-radius:12px;font-size:15px;cursor:pointer;">Back</button>' : '') +
        '<button data-action="next" style="flex:2;padding:14px;border:none;background:linear-gradient(135deg,#00b7ff,#7b2ff2);color:#fff;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">' + (isLast ? "Get Started" : "Next") + '</button>' +
        '</div>' +
        '<button data-action="skip" style="margin-top:12px;background:none;border:none;color:#666;font-size:13px;cursor:pointer;">Skip Tour</button>' +
        '</div>';

      modal.querySelector('[data-action="skip"]').onclick = function() { state.completed = true; saveOnboardingState(state); modal.remove(); };
      modal.querySelector('[data-action="next"]').onclick = function() {
        if (isLast) { state.completed = true; saveOnboardingState(state); modal.remove(); }
        else { currentStep++; renderStep(); }
      };
      var closeBtn = modal.querySelector('#onbClose');
      if (closeBtn) closeBtn.onclick = function() { modal.remove(); };
      var prevBtn = modal.querySelector('[data-action="prev"]');
      if (prevBtn) prevBtn.onclick = function() { currentStep--; renderStep(); };
    }

    renderStep();
    document.body.appendChild(modal);
  }

  var tips = {
    index: { id: "tip_index", text: "Swipe up to see more videos!", position: "top" },
    upload: { id: "tip_upload", text: "Choose a video file and add a caption to share with the world!", position: "bottom" },
    profile: { id: "tip_profile", text: "Edit your profile, view your videos, and manage your followers here.", position: "bottom" },
    discover: { id: "tip_discover", text: "Browse trending videos and find new creators to follow!", position: "top" },
    notifications: { id: "tip_notifications", text: "See who liked your videos, followed you, and more!", position: "bottom" }
  };

  function showTip(pageTipKey) {
    var state = getOnboardingState();
    if (state.completed) return;
    if (state.tipsSeen[pageTipKey]) return;
    if (!localStorage.getItem("CloudTokToken")) return;

    var tip = tips[pageTipKey];
    if (!tip) return;

    var banner = document.createElement("div");
    banner.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#00b7ff,#7b2ff2);color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;z-index:9998;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,183,255,.3);max-width:90%;animation:onbSlideIn .3s ease;";
    banner.innerHTML = '<span style="font-size:16px;">💡</span><span>' + tip.text + '</span><button style="background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:16px;padding:0 0 0 8px;" id="tipClose">✕</button>';

    var style = document.createElement("style");
    style.textContent = "@keyframes onbSlideIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}";
    document.head.appendChild(style);

    banner.querySelector("#tipClose").onclick = function() {
      state.tipsSeen[pageTipKey] = true;
      saveOnboardingState(state);
      banner.remove();
    };

    setTimeout(function() {
      state.tipsSeen[pageTipKey] = true;
      saveOnboardingState(state);
      if (banner.parentNode) banner.remove();
    }, 8000);

    document.body.appendChild(banner);
  }

  function addTooltip(selector, text, position) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.style.position = "relative";
    el.style.cursor = "help";
    el.title = text;
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        createWelcomeModal();
      });
    } else {
      createWelcomeModal();
    }
  }

  window.CloudTokOnboarding = {
    init: init,
    showTip: showTip,
    addTooltip: addTooltip,
    reset: function() { localStorage.removeItem(ONBOARDING_KEY); },
    getState: getOnboardingState
  };

  init();
})();
