"use client";

import type { CSSProperties, ReactNode } from "react";
import { BIRTHDAY_ADULT_ART, BIRTHDAY_ADULT_DIRECTION } from "@/data/birthday-adult-art";
import { BirthdaySceneCopy, BirthdaySceneFacts, BirthdaySceneRsvp } from "./primitives";
import type { BirthdaySceneProps } from "./types";

export default function AdultBirthdayScenes(props: BirthdaySceneProps) {
  const { theme } = props;
  const direction = BIRTHDAY_ADULT_DIRECTION[theme.id];
  const src = theme.decorations?.heroImage || theme.heroImage || BIRTHDAY_ADULT_ART[theme.id];
  if (!direction || !src) return null;
  const art = (className: string) => (
    <img
      src={src}
      alt=""
      className={`template-hero-image object-cover ${className}`}
      loading="eager"
      decoding="async"
    />
  );
  const copy = (className: string, titleClassName: string) => (
    <BirthdaySceneCopy {...props} className={className} titleClassName={titleClassName} />
  );
  const facts = (className: string) => <BirthdaySceneFacts {...props} className={className} />;
  const rsvp = (className: string) => <BirthdaySceneRsvp {...props} className={className} />;
  let composition: ReactNode;
  switch (theme.id) {
    case "champagne-bow-soiree":
      composition = (
        <>
          <div className="relative mx-auto w-4/5 md:w-1/2">
            {art("aspect-[4/3] rounded-t-[50%]")}
            <div className="absolute -left-10 top-1/3 h-28 w-28 rounded-full border border-current opacity-30" />
          </div>
          <div className="mx-auto max-w-lg text-center pt-16 pb-8">
            <small>AN EVENING TO REMEMBER</small>
            {copy("mt-7 font-serif italic", "!text-5xl md:!text-7xl")}
          </div>

          {facts("justify-center py-8")}
          {rsvp("justify-center pb-12")}
        </>
      );
      break;
    case "garden-brunch-bloom":
      composition = (
        <div className="grid md:grid-cols-[1fr_1.15fr] gap-0">
          <div className="order-2 md:order-1 p-8 md:p-14 border-y border-current/20">
            <small>THE GARDEN IS OPEN</small>
            {copy("mt-8", "!text-5xl md:!text-7xl")}
            {facts("mt-8 flex-col !items-start")}
            {rsvp("mt-8")}
          </div>
          <div className="relative p-5 md:py-10 md:pl-0">
            {art("aspect-[4/5] rounded-t-full")}
            <span className="absolute bottom-14 right-1 bg-[#edf0df] p-5 italic text-2xl">
              in full bloom
            </span>
          </div>
        </div>
      );
      break;
    case "rose-gold-rooftop-forty":
      composition = (
        <>
          {art("aspect-[2.5/1] w-full")}
          <div className="relative -mt-12 mx-5 md:mx-16 border-t-4 border-current bg-[#e7b9aa] p-7 md:p-12">
            <small>ABOVE IT ALL</small>
            {copy("mt-4", "!text-5xl md:!text-8xl")}
            {facts("mt-8")}
            {rsvp("mt-6")}
          </div>
        </>
      );
      break;
    case "parisian-patisserie-thirty":
      composition = (
        <>
          <div className="h-6 bg-[repeating-linear-gradient(90deg,#752b41_0_30px,transparent_30px_60px)]" />
          <div className="mx-6 my-8 md:m-12 border-2 border-current p-6 md:p-10 text-center">
            {art("mx-auto aspect-[2/1] max-w-2xl rounded-[50%]")}
            <small>LA MAISON • A CELEBRATION</small>
            {copy("my-8", "!text-5xl md:!text-6xl italic")}

            {facts("justify-center my-8")}
            {rsvp("justify-center")}
          </div>
        </>
      );
      break;
    case "coastal-white-linen-fifty":
      composition = (
        <div className="relative min-h-[600px] flex items-end">
          {art("absolute inset-0 h-full w-full opacity-70")}
          <div className="relative w-full p-8 md:p-16 bg-gradient-to-t from-[#edf2ef] via-[#edf2ef]/90 to-transparent pt-48">
            <small>BY THE WATER</small>
            {copy("max-w-2xl", "!text-6xl md:!text-8xl font-light")}
            {facts("mt-10")}
            {rsvp("mt-7")}
          </div>
        </div>
      );
      break;
    case "disco-cowgirl-night":
      composition = (
        <div className="p-7 md:p-12">
          <small className="tracking-[.5em]">BOOTS ON. LIGHTS DOWN.</small>
          <div className="relative mt-8 pb-12">
            {art("ml-auto w-3/4 aspect-square rounded-full border-[12px] border-[#290d36]")}
            <div className="relative md:absolute left-0 top-12 max-w-xl -mt-12 md:mt-0">
              {copy(
                "rotate-[-5deg] bg-[#f2509f]/95 p-5",
                "!text-6xl md:!text-8xl uppercase font-black",
              )}
            </div>
          </div>
          {facts("border-y border-current py-5")}
          {rsvp("mt-7")}
        </div>
      );
      break;
    case "bookshop-candle-dinner-forty-five":
      composition = (
        <div className="grid md:grid-cols-[72px_1fr_1fr] p-6 md:p-10 gap-8">
          <div className="hidden md:block [writing-mode:vertical-rl] border-l-2 border-current text-xl tracking-[.3em]">
            A NEW CHAPTER
          </div>
          <div className="relative">
            {art("h-full min-h-80 rounded-tl-[120px]")}
            <span className="absolute bottom-6 left-6 text-white italic text-2xl">
              good company, great stories
            </span>
          </div>
          <div className="pt-6">
            <small>YOU ARE PART OF THE STORY</small>
            {copy("mt-8", "!text-5xl md:!text-6xl")}
            {facts("mt-8 !flex-col !items-start")}
            {rsvp("mt-8")}
          </div>

        </div>
      );
      break;
    case "spa-day-sage-forty":
      composition = (
        <div className="mx-auto max-w-4xl px-7 py-14 text-center">
          <small>A MOMENT TO PAUSE</small>
          <div className="grid grid-cols-3 gap-5 mt-10 items-center">
            {art("aspect-square rounded-full opacity-70")}
            {art("aspect-[3/4] rounded-full")}
            {art("aspect-square rounded-full opacity-70")}
          </div>
          {copy("mt-12", "!text-5xl md:!text-7xl font-light")}
          {facts("justify-center mt-8")}
          {rsvp("justify-center mt-8")}
        </div>
      );
      break;
    case "mahogany-wine-table-fifty-five":
      composition = (
        <div className="relative p-5 md:p-14">
          {art("absolute inset-0 w-full h-full brightness-[.4]")}
          <div className="relative mx-auto max-w-lg border border-[#f5dbc0]/60 p-8 md:p-12 text-center">
            <small>RESERVE AN EVENING</small>
            <div className="w-12 border-t mx-auto my-8" />
            {copy("", "!text-5xl md:!text-6xl")}
            {facts("!flex-col justify-center mt-10")}
            {rsvp("justify-center mt-8")}
            <p className="text-xs tracking-[.3em] mt-10">A FINE YEAR • A FINER COMPANY</p>
          </div>
        </div>
      );
      break;
    case "sunset-pool-cabana-thirty-five":
      composition = (
        <div className="p-6 md:p-12">
          <div className="rotate-[-2deg] bg-[#fff9e8] p-3 pb-8 shadow-xl">
            {art("aspect-[2/1]")}
            <p className="text-center pt-5 italic">Wish you were here. Now you can be.</p>
          </div>
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 mt-14">
            {copy("", "!text-5xl md:!text-7xl")}
            <div className="border-l border-current pl-7">
              {facts("!flex-col !items-start")}
              {rsvp("mt-7")}
            </div>
          </div>
        </div>
      );
      break;
    case "sculptural-floral-forty":
      composition = (
        <>
          <div className="grid md:grid-cols-2 gap-0">
            {art("h-full min-h-[420px]")}
            <div className="p-8 md:p-12">
              <small>AN OCCASION, ARTFULLY ARRANGED</small>
              {copy("mt-14", "!text-6xl md:!text-8xl")}
              {facts("mt-12 !flex-col !items-start")}
            </div>

          </div>
          <div className="border-t border-current/30 mx-8 py-8 flex justify-between gap-6">
            <span className="italic text-2xl">You complete the arrangement.</span>
            {rsvp("")}
          </div>
        </>
      );
      break;
    case "emerald-cocktail-forty-five":
      composition = (
        <div className="m-5 md:m-10 border-[3px] border-current p-3">
          <div className="border border-current p-7 md:p-12 text-center">
            <div className="grid grid-cols-[1fr_70px_1fr] items-center gap-6">
              <hr />
              <span className="text-5xl">◇</span>
              <hr />
            </div>
            {art(
              "mx-auto mt-8 w-56 aspect-square [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]",
            )}
            {copy("mt-8", "!text-5xl md:!text-7xl uppercase tracking-wider")}

            {facts("justify-center mt-8")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "pearl-dinner-fifty":
      composition = (
        <div className="relative px-6 pt-14 pb-10 text-center">
          {art("mx-auto w-4/5 md:w-2/3 aspect-[3/2] rounded-[50%] opacity-80")}
          <div className="relative -mt-24 bg-[#f8f2e9]/90 rounded-t-full p-10 mx-auto max-w-xl">
            {copy("", "!text-5xl md:!text-7xl italic")}
            {facts("justify-center mt-8")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "lavender-tea-sixty":
      composition = (
        <div className="mx-auto max-w-3xl text-center p-7 md:p-14">
          <span className="block text-4xl">❦</span>
          {art("mx-auto w-64 aspect-square rounded-full border-8 border-white/50")}
          <small>TEA, LAUGHTER & LOVELY COMPANY</small>
          {copy("my-10", "!text-5xl md:!text-7xl")}

          {facts("justify-center mt-8")}
          {rsvp("justify-center mt-8")}
          <span className="block text-4xl mt-10">❦</span>
        </div>
      );
      break;
    case "golden-jubilee-seventy":
      composition = (
        <div className="relative overflow-hidden px-7 py-16 text-center">
          <div className="absolute inset-0 opacity-20 bg-[repeating-conic-gradient(from_0deg_at_50%_50%,#72501f_0deg_1deg,transparent_1deg_15deg)]" />
          <div className="relative mx-auto max-w-3xl">
            {art("mx-auto my-10 w-60 aspect-square rounded-t-full")}
            <small>A LIFE BEAUTIFULLY CELEBRATED</small>
            {copy("mt-8", "!text-6xl md:!text-8xl")}

            {facts("justify-center")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "whiskey-library-forty-five":
      composition = (
        <div className="p-6 md:p-10">
          <div className="border-y-2 border-current py-4 tracking-[.3em] text-center">
            THE PRIVATE CLUB
          </div>
          <div className="grid md:grid-cols-[1.1fr_1fr] mt-9 gap-9">
            {art("h-full min-h-80")}
            <div className="self-center py-6">
              {copy("", "!text-5xl md:!text-7xl")}
              {facts("!flex-col !items-start mt-8")}
              {rsvp("mt-8")}
            </div>
          </div>
          <p className="text-center border-b border-current py-7 italic">
            A little older. A little rarer.
          </p>
        </div>
      );
      break;
    case "vintage-garage-forty":
      composition = (
        <div className="p-7 md:p-12">
          <div className="flex justify-between border-b-4 border-current pb-3 font-black tracking-[.2em]">
            <span>BUILT TO CELEBRATE</span>
            <span>EST. GOOD TIMES</span>
          </div>
          {art("aspect-[2.5/1] mt-8 [clip-path:polygon(4%_0,100%_0,96%_100%,0_100%)]")}
          {copy("mt-8 uppercase", "!text-6xl md:!text-8xl font-black")}

          {facts("mt-8")}
          {rsvp("mt-6")}
        </div>
      );
      break;
    case "stadium-suite-fifty":
      composition = (
        <>
          {art("aspect-[2.7/1]")}
          <div className="p-6 md:p-12">
            <div className="border-4 border-current p-6 md:p-8">
              <small className="tracking-[.4em]">YOU'RE ON THE GUEST LIST</small>
              {copy("mt-7 uppercase", "!text-6xl md:!text-8xl font-black")}
              {facts("mt-8 border-t-2 border-dashed border-current pt-6")}
              {rsvp("mt-8")}
            </div>
          </div>
        </>
      );
      break;
    case "golf-club-forty-five":
      composition = (
        <div className="grid md:grid-cols-[1.3fr_1fr]">
          {art("h-full min-h-[450px] [clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]")}
          <div className="p-8 md:p-12">
            <small>THE CELEBRATION CLUB</small>
            {copy("mt-8", "!text-5xl md:!text-7xl")}
            {facts("!flex-col !items-start mt-10 border-y border-current/40 py-6")}
            {rsvp("mt-8")}
          </div>

        </div>
      );
      break;
    case "backyard-bbq-fifty":
      composition = (
        <div className="p-6 md:p-10 border-y-[14px] border-[#52261b]">
          {art("aspect-[2.3/1] rounded-[45%_45%_0_0]")}
          <small className="block text-center tracking-[.4em]">LOW & SLOW • GOOD & LOUD</small>
          {copy("text-center my-7 uppercase", "!text-6xl md:!text-8xl font-black")}

          <div className="mt-8 border-2 border-dashed border-current p-6">
            {facts("justify-center")}
            {rsvp("justify-center mt-6")}
          </div>
        </div>
      );
      break;
    case "craft-brew-hall-thirty":
      composition = (
        <div className="grid md:grid-cols-2 p-7 md:p-12 gap-9 items-center">
          <div>
            {art("aspect-square rounded-t-full")}
            {facts("mt-7")}
            {rsvp("mt-7")}
          </div>
          <div className="border-[10px] border-double border-current rounded-full p-8 text-center aspect-square flex flex-col justify-center">
            <small>FRESHLY TAPPED GOOD TIMES</small>
            {copy("mt-6 uppercase", "!text-4xl md:!text-5xl font-black")}
          </div>

        </div>
      );
      break;
    case "black-tie-forty":
      composition = (
        <div className="relative min-h-[650px] p-8 md:p-16 flex flex-col justify-between">
          {art("absolute inset-0 h-full w-full opacity-40")}
          <small className="relative text-center tracking-[.5em]">THE EVENING IS YOURS</small>
          <div className="relative max-w-2xl py-16">{copy("", "!text-6xl md:!text-8xl")}</div>
          <div className="relative border-t border-current/40 pt-7">
            {facts("")}
            {rsvp("mt-7")}
          </div>
        </div>
      );
      break;
    case "bourbon-bluegrass-sixty":
      composition = (
        <>
          <div className="grid md:grid-cols-[1fr_1.2fr]">
            <div className="p-6 md:pl-0">{art("h-full min-h-96 rounded-t-full")}</div>
            <div className="px-8 py-14">
              {copy("uppercase", "!text-6xl md:!text-8xl font-black")}
              <div className="w-20 border-t-4 border-current my-8" />
              {facts("!flex-col !items-start")}
              {rsvp("mt-8")}
            </div>

          </div>
          <p className="text-center border-y border-current py-4 tracking-[.3em]">
            GOOD MUSIC • GREAT COMPANY
          </p>
        </>
      );
      break;
    case "coastal-sailing-fifty":
      composition = (
        <div className="p-6 md:p-12">
          <div className="flex gap-3 mb-10">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className="h-10 w-8 bg-current [clip-path:polygon(0_0,100%_0,100%_100%,50%_70%,0_100%)] opacity-60"
              />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-9">
            {art("aspect-[4/5] [clip-path:polygon(0_0,100%_14%,100%_100%,0_100%)]")}
            {copy("self-center", "!text-5xl md:!text-7xl")}

          </div>
          {facts("border-t-2 border-current mt-9 pt-7")}
          {rsvp("mt-7")}
        </div>
      );
      break;
    case "modern-steakhouse-forty-five":
      composition = (
        <div className="p-6 md:p-12 grid md:grid-cols-[1fr_1.4fr] gap-10">
          {art("h-full min-h-[450px] rounded-t-[45%]")}
          <div className="border-y border-current py-8">
            <small>AN EVENING AT THE TABLE</small>
            {copy("my-10", "!text-5xl md:!text-6xl")}
            {facts("!flex-col !items-start")}
            {rsvp("mt-8")}
          </div>

        </div>
      );
      break;
    case "vinyl-listening-thirty-five":
      composition = (
        <div className="p-6 md:p-12">
          <small className="tracking-[.4em]">SIDE A / THE GOOD YEARS</small>
          <div className="grid md:grid-cols-[1.1fr_1fr] items-center mt-10 gap-7">
            {art("aspect-square rounded-full border-[20px] border-[#242322] shadow-xl")}
            {copy("", "!text-5xl md:!text-7xl")}
          </div>
          <div className="mt-10 border-t-2 border-current pt-6">
            {facts("")}
            {rsvp("mt-8")}
          </div>
        </div>
      );
      break;
    case "mountain-lodge-fifty-five":
      composition = (
        <>
          <div className="relative">
            {art(
              "aspect-[2/1] [clip-path:polygon(0_0,100%_0,100%_85%,75%_100%,50%_85%,25%_100%,0_85%)]",
            )}
          </div>
          <div className="p-7 md:p-12 text-center">
            <small>COME AWAY FOR A CELEBRATION</small>
            {copy("mt-7", "!text-5xl md:!text-7xl")}
            {facts("justify-center mt-8")}
            {rsvp("justify-center mt-8")}
          </div>
        </>
      );
      break;
    case "poker-night-forty":
      composition = (
        <div className="p-7 md:p-12">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-center">
            {art("aspect-square [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]")}
            <div>
              {facts("!flex-col !items-start")}
              {rsvp("mt-8")}
              <p className="italic mt-8">Save your seat at the table.</p>
            </div>
          </div>
          <div className="text-center">
            <span className="text-5xl">♦</span>
            {copy("my-8", "!text-5xl md:!text-7xl")}
          </div>

        </div>
      );
      break;
    case "classic-roadster-seventy":
      composition = (
        <div className="p-7 md:p-12">
          <div className="border-b border-current flex justify-between pb-4">
            <small>THE CLASSICS COLLECTION</small>
            <small>ONE OF A KIND</small>
          </div>
          {art("aspect-[2.6/1] mt-7")}
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 mt-9">
            {copy("", "!text-5xl md:!text-7xl")}
            <div className="border-l border-current pl-7">
              {facts("!flex-col !items-start")}
              {rsvp("mt-7")}
            </div>
          </div>
        </div>
      );
      break;
    case "observatory-night-sixty-five":
      composition = (
        <div className="relative px-7 py-14 overflow-hidden">
          <div className="absolute w-[650px] h-[650px] border border-current/20 rounded-full -right-40 -top-12" />
          <div className="absolute w-[780px] h-[780px] border border-current/10 rounded-full -right-56 -top-28" />
          <div className="relative grid md:grid-cols-[1.2fr_1fr] items-center gap-8">
            {art("aspect-square rounded-full")}
            <div>
              <small>A NIGHT WRITTEN IN THE STARS</small>
              {copy("mt-8", "!text-5xl md:!text-7xl")}
              {facts("mt-8 !flex-col !items-start")}
              {rsvp("mt-8")}
            </div>

          </div>
        </div>
      );
      break;
    case "mediterranean-dinner-forty":
      composition = (
        <div className="p-6 md:p-12">
          <div className="mx-auto max-w-3xl rounded-t-full border-[10px] border-double border-current overflow-hidden">
            {art("aspect-[2/1]")}
            <div className="p-8 text-center">
              {copy("", "!text-5xl md:!text-7xl")}
              {facts("justify-center mt-8")}
              {rsvp("justify-center mt-8")}
            </div>
          </div>
        </div>
      );
      break;
    case "rooftop-city-lights-thirty":
      composition = (
        <>
          <div className="relative min-h-[600px]">
            {art("absolute inset-0 h-full w-full opacity-60")}
            <div className="relative p-7 md:p-12">
              <small className="tracking-[.5em]">MEET US AT THE TOP</small>
              {copy("mt-36 uppercase", "!text-6xl md:!text-8xl font-black")}
            </div>
          </div>
          <div className="px-7 md:px-12 py-8 border-t-4 border-current">
            {facts("")}
            {rsvp("mt-7")}
          </div>
        </>
      );
      break;
    case "modern-minimal-fifty":
      composition = (
        <div className="p-8 md:p-16 grid md:grid-cols-[1.5fr_1fr] gap-10 items-start">
          <div className="pt-10">
            {art("aspect-[3/5]")}
            {facts("!flex-col !items-start mt-8")}
          </div>
          <div>
            <small className="tracking-[.3em]">THE ART OF CELEBRATING</small>
            {copy("mt-20", "!text-6xl md:!text-8xl font-light")}
            {rsvp("mt-12")}
          </div>

        </div>
      );
      break;
    case "tropical-sunset-forty-five":
      composition = (
        <div className="relative min-h-[660px] flex items-center justify-center p-7">
          {art("absolute inset-0 h-full w-full")}
          <div className="relative bg-[#ed8669]/90 max-w-xl rounded-t-full p-8 md:p-16 text-center">
            <small>THE SUNSET CELEBRATION</small>
            {copy("mt-8", "!text-5xl md:!text-7xl italic")}
            {facts("justify-center mt-8")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "art-gallery-cocktail-thirty-five":
      composition = (
        <div className="p-7 md:p-12">
          <div className="grid md:grid-cols-[1.3fr_1fr] gap-7">
            {art("aspect-[4/5] border-[18px] border-[#2145be]")}
            {copy("uppercase self-end", "!text-6xl md:!text-8xl font-black")}

          </div>
          <div className="grid md:grid-cols-[1fr_2fr] gap-8 mt-10 border-t border-current pt-7">
            <span className="font-mono text-sm">
              YOU ARE INVITED
              <br />
              TO SOMETHING ORIGINAL.
            </span>
            <div>
              {facts("")}
              {rsvp("mt-7")}
            </div>
          </div>
        </div>
      );
      break;
    case "backyard-long-table-sixty":
      composition = (
        <>
          {art("w-full aspect-[2.3/1] mt-10")}
          <div className="text-center pt-12 px-7">
            <small>THERE'S A PLACE FOR YOU</small>
            {copy("mt-7", "!text-5xl md:!text-7xl")}
          </div>

          <div className="max-w-3xl mx-auto px-7 py-10 border-x border-current/20">
            {facts("justify-center")}
            {rsvp("justify-center mt-7")}
          </div>
        </>
      );
      break;
    case "eighties-retro-dance-forty":
      composition = (
        <div className="p-7 md:p-12">
          <div className="border-[6px] border-current shadow-[12px_12px_0_#3ed8dc] p-6 md:p-10">
            {art("mt-10 aspect-[2.4/1]")}
            {copy("uppercase rotate-[-3deg]", "!text-6xl md:!text-8xl font-black")}

            {facts("mt-8")}
            {rsvp("mt-8")}
          </div>
        </div>
      );
      break;
    case "black-white-photo-fifty":
      composition = (
        <div className="p-7 md:p-12">
          <small className="font-mono">A LIFE IN GOOD LIGHT</small>
          <div className="grid grid-cols-[1fr_2fr] gap-3 mt-8">
            <div className="grid gap-3">
              {art("h-full grayscale")}
              {art("h-full grayscale object-bottom")}
            </div>
            {art("aspect-[4/5] grayscale")}
          </div>
          <div className="mt-9 flex flex-col md:flex-row gap-8">
            {copy("flex-1", "!text-5xl md:!text-7xl")}
            <div className="md:max-w-xs">
              {facts("!flex-col !items-start")}
              {rsvp("mt-8")}
            </div>
          </div>
        </div>
      );
      break;
    case "night-market-thirty":
      composition = (
        <div className="relative p-7 md:p-12">
          {art("absolute inset-0 w-full h-full brightness-[.3]")}
          <div className="relative border-x-2 border-current p-6 md:p-10">
            <small className="tracking-[.4em]">FOLLOW THE LANTERNS</small>
            {copy("mt-12 max-w-2xl uppercase", "!text-6xl md:!text-8xl")}
            {facts("mt-12 !flex-col !items-start")}
            {rsvp("mt-8")}
          </div>
        </div>
      );
      break;
    case "desert-dusk-fifty-five":
      composition = (
        <div className="grid md:grid-cols-[1fr_1.2fr] p-7 md:p-12 gap-10 items-end">
          {art("aspect-[3/4] rounded-t-[50%] border-[12px] border-[#3b5555]/30")}
          <div>
            <small>WHERE THE DAY BECOMES GOLD</small>
            {copy("mt-12", "!text-5xl md:!text-7xl")}
            {facts("!flex-col !items-start mt-10")}
            {rsvp("mt-8")}
          </div>

        </div>
      );
      break;
    case "paper-atelier-first-anniversary":
      composition = (
        <div className="p-6 md:p-12">
          <div className="bg-white/50 p-8 md:p-12 shadow-[8px_10px_0_#d8cbb9] rotate-[-1deg]">
            <div className="grid md:grid-cols-[1fr_1fr] mt-10 gap-8">
              {art("aspect-[3/2]")}
              <div>
                {facts("!flex-col !items-start")}
                {rsvp("mt-7")}
              </div>
            </div>
            <small>WITH LOVE, AN INVITATION</small>
            {copy("mt-10", "!text-5xl md:!text-7xl italic")}

          </div>
        </div>
      );
      break;
    case "woodland-table-fifth-anniversary":
      composition = (
        <div className="relative p-6 md:p-12">
          {art("aspect-[2/1] rounded-t-full")}
          <div className="relative mx-auto max-w-xl -mt-14 rounded-t-full bg-[#e5dcc2] p-8 md:p-12 text-center">
            <small>ROOTED IN LOVE</small>
            {copy("mt-6", "!text-5xl md:!text-7xl")}
            {facts("justify-center mt-8")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "tin-copper-tenth-anniversary":
      composition = (
        <div className="grid md:grid-cols-[1fr_1fr] gap-0 p-6 md:p-10">
          {art("h-full min-h-[480px] border-y border-r border-current")}
          <div className="border border-current p-7 md:p-10">
            <small>STILL SHINING</small>
            {copy("mt-16", "!text-5xl md:!text-7xl")}
            {facts("!flex-col !items-start mt-10")}
            {rsvp("mt-8")}
          </div>

        </div>
      );
      break;
    case "crystal-dinner-fifteenth-anniversary":
      composition = (
        <div className="relative py-14 px-7 text-center">
          {art("absolute inset-0 w-full h-full opacity-40")}
          <div className="relative max-w-3xl mx-auto">
            <small>LOVE, IN EVERY LIGHT</small>
            {copy("mt-10", "!text-6xl md:!text-8xl")}
            <div className="h-24 border-l border-current w-px mx-auto my-8" />
            {facts("justify-center")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "porcelain-blue-twentieth-anniversary":
      composition = (
        <div className="m-5 md:m-10 border-[12px] border-double border-current px-7 py-12 text-center">
          <small>A BEAUTIFUL TRADITION</small>
          {art("w-52 aspect-square rounded-full mx-auto my-8")}
          {copy("", "!text-5xl md:!text-7xl")}
          {facts("justify-center mt-8")}
          {rsvp("justify-center mt-8")}
        </div>
      );
      break;
    case "silver-night-twenty-fifth-anniversary":
      composition = (
        <div className="p-7 md:p-12 grid md:grid-cols-[1.1fr_1fr] items-center gap-10">
          <div className="relative">
            {art("aspect-square rounded-full")}
            <div className="absolute -inset-5 border border-current/40 rounded-full" />
            <p className="mt-12 text-center tracking-[.3em] text-xs">A LOVE THAT LIGHTS THE ROOM</p>
          </div>
          <div>
            {copy("", "!text-5xl md:!text-7xl")}
            {facts("!flex-col !items-start mt-10")}
            {rsvp("mt-8")}
          </div>

        </div>
      );
      break;
    case "pearl-supper-thirtieth-anniversary":
      composition = (
        <div className="p-7 md:p-14">
          {art("mt-10 aspect-[2.2/1] rounded-[50%_50%_12%_12%]")}
          <div className="text-center max-w-2xl mx-auto">
            <small>TIME MAKES LOVE LUMINOUS</small>
            {copy("mt-10", "!text-5xl md:!text-7xl italic")}
          </div>

          {facts("justify-center mt-9")}
          {rsvp("justify-center mt-8")}
        </div>
      );
      break;
    case "ruby-gala-fortieth-anniversary":
      composition = (
        <div className="relative min-h-[650px] p-8 md:p-16 flex flex-col items-center justify-center text-center">
          {art("absolute inset-0 h-full w-full brightness-[.45]")}
          <div className="relative max-w-2xl border-y border-current py-12">
            <small>THE GRAND CELEBRATION</small>
            {copy("mt-8", "!text-6xl md:!text-8xl")}
            {facts("justify-center mt-10")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "golden-dinner-fiftieth-anniversary":
      composition = (
        <div className="p-7 md:p-12 text-center">
          <div className="border-2 border-current p-6 md:p-10 rounded-t-[45%]">
            <small>A GOLDEN KIND OF LOVE</small>
            {art("mx-auto my-9 w-56 aspect-square rounded-t-full")}
            {copy("", "!text-5xl md:!text-7xl")}
            {facts("justify-center mt-8")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    case "garden-vow-renewal-anniversary":
      composition = (
        <div className="grid md:grid-cols-[1fr_1fr] p-7 md:p-12 gap-10 items-center">
          {art("aspect-[3/4] rounded-t-full border-8 border-white/50")}
          <div className="text-center">
            <small>WE'D CHOOSE IT ALL AGAIN</small>
            {copy("mt-10", "!text-5xl md:!text-7xl italic")}
            <span className="block my-7 text-3xl">❦</span>
            {facts("justify-center")}
            {rsvp("justify-center mt-8")}
          </div>
        </div>
      );
      break;
    default:
      return null;
  }
  return (
    <section
      data-birthday-scene={theme.id}
      className="relative isolate overflow-hidden [&_small]:text-[10px] [&_small]:font-semibold [&_small]:tracking-[.22em]"
      style={
        {
          backgroundColor: direction.primaryColor,
          color: direction.secondaryColor,
          fontFamily: theme.fonts.body,
        } as CSSProperties
      }
    >
      {composition}
    </section>
  );
}
