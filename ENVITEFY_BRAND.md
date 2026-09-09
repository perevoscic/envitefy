# Envitefy — Brand Name & Pronunciation Standard

Effective September 8, 2026; pronunciation updated from the user-supplied recording on September 9, 2026. This is the mandatory source of truth for the written brand name and spoken pronunciation across Envitefy content and production tools.

## Brand name and spelling

- Brand name: **Envitefy**
- Official spelling: **E-N-V-I-T-E-F-Y**
- Always use **Envitefy** in visible brand text, including copy, titles, captions, subtitles, and generated text overlays.
- Never change, correct, respell, or replace the name with “Invitify,” “Invitefy,” “Envitify,” or any other variation.
- Never change the written name to make pronunciation easier or substitute phonetic spelling in customer-facing text.

The existing locked lowercase `envitefy` wordmark and approved `envitefy.com` artwork/domain remain governed by the logo rules in [AGENTS.md](AGENTS.md#envitefy-logo-brand-lock) and the [Video Studio guide](video-studio/STUDIO-GUIDE.md#brand-and-product). This standard does not authorize altering those brand assets.

## Official pronunciation

**Target: in-VY-tih-fy**  
**Approximate IPA: /ɪnˈvaɪtɪfaɪ/**

The user's supplied **envitefy.wav** recording (September 9, 2026) is the acoustic reference. A decoded local copy is [saved with the approved brand audio](video-studio/assets/brand/audio/envitefy-approved-pronunciation-reference.wav). The original supplied file has SHA-256 04655c5247cf95d075555868e6213b1f12f0772f94ab64ef7933f7661d6a31f6.

- Use a short initial **in**.
- Stress **VY**, rhyming with **eye**.
- Follow it with a short, unstressed **tih** syllable.
- Finish with **fy**, rhyming with **fly**.
- Join all four syllables naturally into one word.

This recording replaces the earlier written three-syllable en-VITE-fy approximation for the current audio standard. Use the recording as the acoustic reference; IPA and phonetic spellings describe it approximately. Do not remove the short unstressed vowel heard between VY and fy.

Phonetic spellings and IPA are internal production metadata only. Speech recognition may transcribe the sound as “Invitify”; visible brand text must still be **Envitefy**.

The user explicitly approved the pronunciation on September 9, 2026. Preserve the [approved Jessica narration](video-studio/assets/brand/audio/envitefy-approved-jessica-concierge.mp3) when reusing that line. The [audio manifest](video-studio/assets/brand/audio/pronunciation.json) records the approval, provenance, and file hashes. Use the recording as the authority when written approximations differ.

## Voice and video model instruction

Before generating any dialogue, narration, voice-over, advertisement, social-media video, podcast, or other audio containing the brand name, explicitly include the following instruction for every scene or generation request that speaks the brand. Do not let a TTS engine independently guess its pronunciation.

> The company name Envitefy must match the user-supplied pronunciation recording: approximately /ɪnˈvaɪtɪfaɪ/, in-VY-tih-fy. Say it naturally as one continuous four-syllable word. Use a short initial in, stress VY to rhyme with eye, follow it with a short unstressed tih, and end with fy rhyming with fly. Preserve the short vowel heard between VY and fy. Do not infer pronunciation from spelling. Keep all visible text spelled exactly Envitefy; phonetic spelling and IPA are internal pronunciation metadata only.

Keep pronunciation instructions in model direction or supported pronunciation controls, separate from visible copy and captions. Check generated or automatically transcribed captions for spelling errors.

## Required quality control

Before accepting a generated video or audio asset:

1. Confirm visible brand text is spelled exactly **Envitefy**, while preserving approved wordmark/domain assets as described above.
2. Listen to every spoken occurrence of the brand name. Confirm the sounds, stress, and continuous delivery match the **user-supplied recording** and its pronunciation guidance above.
3. If the pronunciation is incorrect, regenerate or replace the affected audio and review the resulting asset again.
4. Never approve or deliver an asset containing a mispronounced brand name.

## Scope

This standard applies to all Codex agents, Remotion projects, video MCPs, TTS systems, AI video generators, voice-over generators, social-media content, YouTube videos, TikTok/Reels/Shorts, advertisements, product demos, podcasts, and customer-facing audio that use the Envitefy brand name.
