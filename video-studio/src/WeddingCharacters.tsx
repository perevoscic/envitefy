import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { CharacterPortrait } from "./wedding-characters/CharacterPortrait";
import { InvitationInsert } from "./wedding-characters/InvitationInsert";
import { WeddingPayoff } from "./wedding-characters/WeddingPayoff";
import { CharactersEndCard } from "./wedding-characters/EndCard";

export function WeddingCharacters() {
  return (
    <AbsoluteFill
      style={{ background: "#f8f4ec", fontFamily: "Arial, sans-serif" }}
    >
      <Audio src={staticFile("projects/wedding-characters/final-mix-v3.wav")} />
      <Sequence durationInFrames={39} name="The Planner opens the invitation">
        <CharacterPortrait clip="planner-open" character="The Planner" />
      </Sequence>
      <Sequence from={39} durationInFrames={51} name="Planner RSVPs">
        <InvitationInsert kind="rsvp" />
      </Sequence>
      <Sequence from={90} durationInFrames={45} name="Planner adds to calendar">
        <InvitationInsert kind="calendar" />
      </Sequence>
      <Sequence
        from={135}
        durationInFrames={105}
        name="Been ready since February"
      >
        <CharacterPortrait
          clip="planner-reveal"
          character="The Planner"
          dialogue
        />
      </Sequence>
      <Sequence
        from={240}
        durationInFrames={27}
        name="The Dancer reads the invitation"
      >
        <CharacterPortrait
          clip="dancer-open-v2-composite"
          character="The Dancer"
        />
      </Sequence>
      <Sequence from={267} durationInFrames={21} name="Dancer RSVPs">
        <InvitationInsert kind="quick-rsvp" />
      </Sequence>
      <Sequence
        from={288}
        durationInFrames={84}
        name="Ambitious living room rehearsal"
      >
        <CharacterPortrait clip="dancer-dance" character="The Dancer" />
      </Sequence>
      <Sequence
        from={372}
        durationInFrames={24}
        name="The Crier opens the invitation"
      >
        <CharacterPortrait clip="crier-open-v3" character="The Crier" />
      </Sequence>
      <Sequence from={396} durationInFrames={21} name="Crier RSVPs">
        <InvitationInsert kind="quick-rsvp" />
      </Sequence>
      <Sequence
        from={417}
        durationInFrames={108}
        name="The silent tissue box handoff"
      >
        <CharacterPortrait clip="crier-tissue-v3" character="The Crier" />
      </Sequence>
      <Sequence
        from={525}
        durationInFrames={114}
        name="Together at the wedding"
      >
        <WeddingPayoff />
      </Sequence>
      <Sequence from={639} durationInFrames={111} name="Bring yours together">
        <CharactersEndCard />
      </Sequence>
    </AbsoluteFill>
  );
}

