tweaks-panel.jsx (prototype-host Tweaks shell) was intentionally not copied verbatim.
It provides: useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle,
TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton — plus the
claude.ai/design host edit-mode postMessage protocol. For production, replace useTweaks
with local state (or localStorage persistence) and decide whether the Tweaks panel ships at all.
Full source remains in the design project (file: tweaks-panel.jsx).
