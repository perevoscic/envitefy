"use client";

import { BIRTHDAY_ORIGINAL_ART } from "@/data/birthday-original-art";
import type { BirthdaySceneProps } from "./types";
import {
  BirthdaySceneCopy as Copy,
  BirthdaySceneFacts as Facts,
  BirthdaySceneRsvp as Rsvp,
} from "./primitives";

/** Original catalog: each invitation has its own composition, independent of the shared data controls. */
export default function OriginalBirthdayScenes(props: BirthdaySceneProps) {
  const { theme, event, actions } = props;
  const source = theme.heroImage || BIRTHDAY_ORIGINAL_ART[theme.id];
  const art = (className: string) =>
    source ? <img src={source} alt="" aria-hidden="true" className={className} /> : null;
  const mark = event.age || "✦";
  const tools = actions ? <div className="relative z-20 px-5 pt-4">{actions}</div> : null;
  switch (theme.id) {
    case "party-pop":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative isolate overflow-hidden bg-[#183cda] text-[#ffef59]"
        >
          {tools}
          {art("absolute inset-0 h-full w-full object-cover opacity-65 sm:opacity-100")}
          <div className="relative min-h-[620px] bg-gradient-to-r from-[#183cda] via-[#183cda]/70 to-transparent px-7 py-20 sm:px-14">
            <p className="mb-8 text-sm font-black uppercase tracking-[.3em]">Make some noise</p>
            <Copy
              {...props}
              className="max-w-[600px]"
              titleClassName="font-black uppercase !text-[clamp(3rem,8cqw,7rem)]"
            />
            <Facts {...props} className="mt-12 max-w-lg" />
            <Rsvp {...props} className="mt-8" />
          </div>
          <div
            aria-hidden="true"
            className="relative -rotate-2 bg-[#ff6a4e] py-3 text-center text-lg font-black tracking-[.5em] text-[#183cda]"
          >
            POP · PARTY · PLAY · POP · PARTY · PLAY
          </div>
        </section>
      );
    case "candy-dreams":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative overflow-hidden bg-[#ffe3ed] text-[#822e61]"
        >
          {tools}
          <div className="relative mx-auto max-w-3xl px-7 pt-16 text-center">
            <p className="mb-5 text-xs uppercase tracking-[.4em]">
              A little sugar. A lot of magic.
            </p>
            <Copy {...props} titleClassName="italic" storyClassName="mx-auto" />
            <Rsvp {...props} className="mt-7 justify-center" />
          </div>
          {art(
            "mt-[-30px] h-[340px] w-full object-cover object-bottom sm:h-[470px] [mask-image:linear-gradient(transparent,black_20%)]",
          )}
          <Facts {...props} className="relative justify-center bg-[#fdf4eb] px-7 py-7" />
        </section>
      );
    case "rainbow-bash":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] overflow-hidden bg-[#fff4d5] text-[#183d45]"
        >
          {tools}
          <div className="grid sm:grid-cols-[.85fr_1.15fr]">
            {art("h-[280px] w-full object-cover sm:row-span-2 sm:h-full")}
            <div className="p-8 sm:p-14">
              <p className="mb-8 border-t-4 border-current pt-3 text-xs font-bold uppercase tracking-[.22em]">
                Good times in every color
              </p>
              <Copy {...props} titleClassName="font-black !text-[clamp(3.4rem,6cqw,7rem)]" />
              <Rsvp {...props} className="mt-10" />
            </div>
            <Facts {...props} className="border-t-2 border-[#183d45] bg-[#ffc341] p-8" />
          </div>
        </section>
      );
    case "playful-pals":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#d8eee3] text-[#355646]"
        >
          {tools}
          <div className="px-6 pt-12 text-center">
            <span className="inline-block rotate-[-5deg] rounded-[50%] bg-[#ffdd8c] px-8 py-3 font-bold">
              You + me + all our pals
            </span>
            <Copy
              {...props}
              className="mx-auto mt-8 max-w-2xl"
              titleClassName="!text-[clamp(3rem,5cqw,5rem)]"
              storyClassName="mx-auto"
            />
          </div>
          <div className="relative">
            {art("h-[340px] w-full object-cover object-bottom sm:h-[430px]")}
            <div className="relative mx-5 -mt-12 rounded-[50%_50%_0_0/25%_25%_0_0] bg-[#fff8e5] p-8 sm:mx-16">
              <Facts {...props} className="justify-center" />
              <Rsvp {...props} className="mt-6 justify-center" />
            </div>
          </div>
        </section>
      );
    case "birthday-burst":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative overflow-hidden bg-[#ffcb26] text-[#191826]"
        >
          {tools}
          <div className="grid gap-0 p-5 sm:grid-cols-2 sm:p-9">
            <div className="relative z-10 border-[5px] border-[#191826] bg-white p-8 sm:my-12 sm:-mr-10 sm:-rotate-3">
              <p className="mb-6 inline-block bg-[#ec4938] px-4 py-2 font-black text-white">
                IT’S GONNA BE EPIC!
              </p>
              <Copy {...props} titleClassName="font-black uppercase italic" />
              <Facts {...props} className="mt-8" />
            </div>
            <div className="relative">
              {art("h-full min-h-[340px] w-full border-[5px] border-[#191826] object-cover")}
              <span
                aria-hidden="true"
                className="absolute bottom-5 right-5 rotate-12 bg-[#ffed66] p-7 text-5xl font-black [clip-path:polygon(50%_0,61%_26%,90%_10%,76%_40%,100%_50%,73%_62%,90%_90%,60%_76%,50%_100%,40%_74%,10%_90%,25%_60%,0_50%,26%_39%,10%_10%,40%_25%)]"
              >
                {mark}
              </span>
            </div>
          </div>
          <Rsvp {...props} className="justify-center px-5 pb-10" />
        </section>
      );
    case "sweet-celebration":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#fff4ef] text-[#8c3e4d]"
        >
          {tools}
          <div className="px-7 py-10 text-center">
            <p className="text-xs uppercase tracking-[.35em]">Save room for something sweet</p>
          </div>
          <div className="grid items-center gap-8 px-7 pb-12 sm:grid-cols-[1fr_1.2fr] sm:px-14">
            <div>
              <Copy {...props} titleClassName="italic font-normal" />
              <div className="my-8 h-px w-20 bg-current" />
              <Facts {...props} className="flex-col !items-start" />
              <Rsvp {...props} className="mt-8" />
            </div>
            {art("aspect-[4/5] w-full rounded-t-[50%] object-cover")}
          </div>
          <p
            aria-hidden="true"
            className="border-y border-[#8c3e4d]/30 py-4 text-center text-lg italic"
          >
            A delicious reason to gather
          </p>
        </section>
      );
    case "super-star":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative isolate overflow-hidden bg-[#171236] text-white"
        >
          {tools}
          {art("absolute inset-0 h-full w-full object-cover opacity-65")}
          <div className="relative min-h-[650px] bg-gradient-to-t from-[#171236] via-[#171236]/20 to-transparent px-7 py-14 text-center sm:px-14">
            <p className="text-xs uppercase tracking-[.55em]">Tonight, you’re the star</p>
            <div className="mx-auto mt-44 max-w-4xl">
              <Copy
                {...props}
                inverse
                titleClassName="uppercase font-black !text-[clamp(3.5rem,8cqw,8rem)]"
                storyClassName="mx-auto"
              />
              <Facts {...props} inverse className="mt-9 justify-center" />
              <Rsvp {...props} inverse className="mt-7 justify-center" />
            </div>
          </div>
        </section>
      );
    case "happy-dance":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#ff694a] text-[#232343]"
        >
          {tools}
          <div className="grid sm:grid-cols-[1.25fr_.75fr]">
            <div className="p-8 sm:p-12">
              <p className="text-sm font-black uppercase">Move your feet / feel the beat</p>
              <Copy
                {...props}
                className="my-10"
                titleClassName="font-black uppercase !text-[clamp(3.5rem,7cqw,7rem)]"
              />
              <Rsvp {...props} />
            </div>
            {art("h-[340px] w-full object-cover sm:h-full")}
          </div>
          <div className="flex flex-col gap-5 bg-[#ffc6df] p-7 sm:flex-row sm:items-center sm:justify-between">
            <span aria-hidden="true" className="text-5xl">
              ↗ ↗ ↗
            </span>
            <Facts {...props} />
          </div>
        </section>
      );
    case "magic-sparkle":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#eeebff] text-[#65508e]"
        >
          {tools}
          <div className="relative px-6 pt-14 text-center">
            <p className="mb-6 tracking-[.35em]">✧ ONCE UPON A BIRTHDAY ✧</p>
            <Copy
              {...props}
              className="relative z-10 mx-auto max-w-3xl"
              titleClassName="font-normal"
              storyClassName="mx-auto"
            />
            {art(
              "mx-auto -mt-5 max-h-[410px] w-full object-cover [mask-image:linear-gradient(transparent,black_20%)]",
            )}
          </div>
          <div className="mx-auto max-w-3xl border-t border-[#65508e]/30 px-7 py-9">
            <Facts {...props} className="justify-center" />
            <Rsvp {...props} className="mt-7 justify-center" />
          </div>
        </section>
      );
    case "celebration-time":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#421d2b] text-[#f8e0b7]"
        >
          {tools}
          <div className="grid items-center sm:grid-cols-2">
            {art("h-[380px] w-full object-cover sm:h-[650px]")}
            <div className="m-6 border border-[#f8e0b7]/50 p-7 text-center sm:m-10 sm:p-9">
              <p className="text-xs uppercase tracking-[.35em]">A moment worth celebrating</p>
              <Copy
                {...props}
                className="my-10"
                titleClassName="font-normal italic !text-[clamp(2.7rem,4.8cqw,5.4rem)]"
                storyClassName="mx-auto"
              />
              <Facts {...props} className="justify-center" />
              <Rsvp {...props} className="mt-8 justify-center" />
            </div>
          </div>
        </section>
      );
    case "fun-fiesta":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative bg-[#ffeb63] text-[#ad1745]"
        >
          {tools}
          {art("h-[180px] w-full object-cover sm:h-[230px]")}
          <div className="mx-auto max-w-4xl px-7 py-12 text-center">
            <p className="mb-6 text-sm font-black uppercase tracking-[.35em]">
              Más cake. Más color. Más fun.
            </p>
            <Copy {...props} titleClassName="uppercase font-black" storyClassName="mx-auto" />
            <Facts {...props} className="mt-9 justify-center" />
            <Rsvp {...props} className="mt-8 justify-center" />
          </div>
          <div
            aria-hidden="true"
            className="h-7 bg-[#dd2162] [clip-path:polygon(0_0,100%_0,100%_100%,95%_0,90%_100%,85%_0,80%_100%,75%_0,70%_100%,65%_0,60%_100%,55%_0,50%_100%,45%_0,40%_100%,35%_0,30%_100%,25%_0,20%_100%,15%_0,10%_100%,5%_0,0_100%)]"
          />
        </section>
      );
    case "joyful-jamboree":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#f9e8c4] text-[#874b29]"
        >
          {tools}
          <div className="flex flex-col gap-7 px-8 pt-14 sm:flex-row sm:items-end sm:px-14">
            <div className="flex-1">
              <p className="mb-6 text-xs uppercase tracking-[.3em]">The gang’s getting together</p>
              <Copy {...props} titleClassName="!text-[clamp(3rem,5cqw,6rem)]" />
            </div>
            <div className="sm:max-w-[220px]">
              <Facts {...props} />
              <Rsvp {...props} className="mt-6" />
            </div>
          </div>
          {art("mt-8 h-[300px] w-full object-cover object-[50%_70%] sm:h-[400px]")}
        </section>
      );
    case "whimsical-wonder":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#f9dfd0] text-[#914c46]"
        >
          {tools}
          <div className="grid items-center gap-8 p-7 sm:grid-cols-2 sm:p-12">
            <div className="relative">
              {art("aspect-square w-full rounded-[40%_40%_12%_12%] object-cover")}
              <span
                aria-hidden="true"
                className="absolute -bottom-5 right-3 rotate-6 rounded-full bg-[#ffe885] px-7 py-5 text-3xl italic"
              >
                Oh, what fun!
              </span>
            </div>
            <div className="pt-8 sm:pt-0">
              <Copy {...props} titleClassName="italic" />
              <Facts {...props} className="mt-9" />
              <Rsvp {...props} className="mt-8" />
            </div>
          </div>
          <div aria-hidden="true" className="py-6 text-center text-4xl tracking-[.6em]">
            ✷ · ✷ · ✷
          </div>
        </section>
      );
    case "cheerful-chaos":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] overflow-hidden bg-[#daed4c] text-[#282344]"
        >
          {tools}
          <div className="relative p-6 sm:p-12">
            <Copy
              {...props}
              className="relative z-10 max-w-3xl -rotate-3"
              titleClassName="uppercase font-black !text-[clamp(3.6rem,8cqw,8rem)]"
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-[.8fr_1.2fr]">
              <div className="relative z-10 self-center border-y-4 border-[#282344] py-8">
                <Facts {...props} />
                <Rsvp {...props} className="mt-8" />
              </div>
              {art("h-[330px] w-full rotate-3 object-cover sm:-mt-24 sm:h-[420px]")}
            </div>
          </div>
        </section>
      );
    case "party-parade":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#fff3d9] text-[#a33432]"
        >
          {tools}
          <div
            aria-hidden="true"
            className="h-12 bg-[repeating-linear-gradient(90deg,#a33432_0_40px,#fff3d9_40px_80px)]"
          />
          <div className="grid items-center sm:grid-cols-[1fr_1.1fr]">
            <div className="p-8 text-center sm:p-12">
              <p className="mb-7 text-xs uppercase tracking-[.35em]">Step right up</p>
              <Copy
                {...props}
                titleClassName="uppercase font-black !text-[clamp(3rem,5cqw,5.5rem)]"
                storyClassName="mx-auto"
              />
              <Rsvp {...props} className="mt-8 justify-center" />
            </div>
            {art("h-[360px] w-full object-cover sm:h-[520px]")}
          </div>
          <Facts {...props} className="justify-center border-y-2 border-current p-7" />
        </section>
      );
    case "birthday-bliss":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#171516] text-[#e9d1a0]"
        >
          {tools}
          <div className="grid sm:grid-cols-[.8fr_1.2fr]">
            <div className="flex flex-col justify-center px-8 py-14 sm:px-14">
              <p className="mb-12 text-[10px] uppercase tracking-[.5em]">
                The pleasure of your company
              </p>
              <Copy {...props} titleClassName="font-normal italic !text-[clamp(3rem,5cqw,6rem)]" />
              <Facts {...props} className="mt-12 border-t border-[#e9d1a0]/40 pt-8" />
              <Rsvp {...props} className="mt-8" />
            </div>
            {art("h-[430px] w-full object-cover sm:h-full sm:min-h-[650px]")}
          </div>
        </section>
      );
    case "sparkle-splash":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#d9faf2] text-[#076d78]"
        >
          {tools}
          <div className="relative min-h-[460px] px-5 py-10 sm:min-h-[570px] sm:px-12 sm:py-14">
            {art("absolute inset-0 h-full w-full object-cover")}
            <div className="relative max-w-[500px] rounded-[45%] bg-[#fff4c9]/95 px-8 py-12 text-center">
              <Copy
                {...props}
                titleClassName="italic !text-[clamp(3rem,5cqw,5rem)]"
                storyClassName="mx-auto !max-w-[340px]"
              />
            </div>
          </div>
          <div className="flex flex-col gap-7 px-7 py-9 sm:flex-row sm:items-center sm:justify-between">
            <Facts {...props} />
            <Rsvp {...props} />
          </div>
        </section>
      );
    case "celebration-craze":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative overflow-hidden bg-[#0a142d] text-[#d8ff3f]"
        >
          {tools}
          <div className="grid sm:grid-cols-[1.2fr_.8fr]">
            <div className="px-7 py-16 sm:px-12">
              <p className="mb-8 text-xs uppercase tracking-[.45em]">After dark / until late</p>
              <Copy
                {...props}
                titleClassName="uppercase font-black italic !text-[clamp(3.3rem,7cqw,7rem)]"
              />
              <Rsvp {...props} className="mt-10" />
            </div>
            {art("h-[330px] w-full object-cover sm:h-full")}
          </div>
          <div className="bg-[#d8ff3f] px-7 py-7 text-[#0a142d]">
            <Facts {...props} />
          </div>
        </section>
      );
    case "happy-hooray":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative overflow-hidden bg-[#cce6f2] text-[#315c44]"
        >
          {tools}
          <div className="grid items-start sm:grid-cols-2">
            <div className="relative z-10 px-8 pt-14 sm:px-14">
              <p className="mb-7 text-xs uppercase tracking-[.3em]">Up, up & hooray</p>
              <Copy {...props} titleClassName="!text-[clamp(3.2rem,6cqw,6rem)]" />
              <Rsvp {...props} className="mt-8" />
            </div>
            {art("h-[400px] w-full object-cover sm:h-[580px]")}
          </div>
          <Facts {...props} className="relative justify-center bg-[#f9e6a9] px-7 py-8" />
        </section>
      );
    case "party-palooza":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#f4e4c5] text-[#983f36]"
        >
          {tools}
          <div className="px-7 py-12 text-center">
            <p className="mb-5 text-xs uppercase tracking-[.5em]">Your all-access invitation</p>
            <Copy
              {...props}
              titleClassName="font-black uppercase !text-[clamp(3rem,7cqw,7rem)]"
              storyClassName="mx-auto"
            />
          </div>
          {art("h-[270px] w-full object-cover sm:h-[360px]")}
          <div className="mx-6 my-8 grid gap-6 border-y-2 border-dashed border-current py-7 sm:mx-14 sm:grid-cols-[1fr_auto] sm:items-center">
            <Facts {...props} />
            <Rsvp {...props} />
          </div>
        </section>
      );
    case "birthday-bonanza":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#fff7e8] text-[#e44c42]"
        >
          {tools}
          <div className="grid gap-8 p-7 sm:grid-cols-[1.2fr_.8fr] sm:p-12">
            <div>
              <p className="mb-7 text-xs font-bold uppercase tracking-[.3em]">
                A wonderfully messy celebration
              </p>
              <Copy {...props} titleClassName="font-black !text-[clamp(3.2rem,6cqw,6.8rem)]" />
              <Facts {...props} className="mt-10 text-[#273988]" />
            </div>
            {art("aspect-[4/5] w-full -rotate-3 object-cover shadow-[12px_12px_0_#ffcf44]")}
          </div>
          <div className="bg-[#273988] p-7">
            <Rsvp {...props} inverse className="justify-center" />
          </div>
        </section>
      );
    case "sweet-surprise":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] relative isolate bg-[#101e36] text-[#fbe5ad]"
        >
          {tools}
          {art("absolute inset-0 h-full w-full object-cover opacity-65")}
          <div className="relative bg-gradient-to-b from-[#101e36]/80 via-transparent to-[#101e36] px-7 pb-12 pt-14 text-center">
            <p className="mb-6 text-xs uppercase tracking-[.5em]">Something wonderful awaits</p>
            <Copy
              {...props}
              className="mx-auto max-w-3xl"
              titleClassName="font-normal italic"
              storyClassName="mx-auto"
            />
            <div className="h-52" />
            <Facts {...props} className="justify-center" />
            <Rsvp {...props} className="mt-8 justify-center" />
          </div>
        </section>
      );
    case "party-perfect":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] bg-[#f4cbd3] text-[#772d42]"
        >
          {tools}
          <div className="grid sm:grid-cols-[.9fr_1.1fr]">
            {art("h-[370px] w-full object-cover sm:h-full sm:min-h-[620px]")}
            <div className="flex flex-col justify-center px-8 py-14 sm:px-14">
              <p className="mb-10 text-xs uppercase tracking-[.4em]">Beautiful moments, together</p>
              <Copy {...props} titleClassName="font-normal !text-[clamp(3rem,5cqw,6rem)]" />
              <Facts {...props} className="mt-10 border-y border-current/30 py-7" />
              <Rsvp {...props} className="mt-8" />
            </div>
          </div>
        </section>
      );
    case "birthday-bash":
      return (
        <section
          data-birthday-scene={theme.id}
          className="[container-type:inline-size] overflow-hidden bg-[#163ce0] text-[#fff6d4]"
        >
          {tools}
          <div className="px-7 pt-12 text-center">
            <p className="mb-7 text-xs font-black uppercase tracking-[.4em]">
              The cherry on top of the year
            </p>
            <Copy
              {...props}
              titleClassName="font-black uppercase !text-[clamp(3rem,8cqw,8rem)]"
              storyClassName="mx-auto"
            />
          </div>
          <div className="relative mx-auto max-w-3xl">
            {art("mx-auto h-[360px] w-full object-cover sm:h-[420px]")}
            <div className="relative bg-[#e33f3b] px-7 py-8">
              <Facts {...props} className="justify-center" />
              <Rsvp {...props} className="mt-7 justify-center" />
            </div>
          </div>
        </section>
      );
    default:
      return null;
  }
}
