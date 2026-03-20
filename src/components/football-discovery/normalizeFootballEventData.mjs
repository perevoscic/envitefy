const safeString = (value) =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

const pickArray = (value) => (Array.isArray(value) ? value : []);

const uniqueBy = (items, getKey) => {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const key = safeString(getKey(item)).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const compactJoin = (parts, separator = " • ") =>
  parts.map((part) => safeString(part)).filter(Boolean).join(separator);

const formatDate = (value) => {
  const text = safeString(value);
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value) => {
  const text = safeString(value);
  if (!text) return "";
  const match = text.match(/^(\d{2}):(\d{2})$/);
  if (!match) return text;
  const hour = Number(match[1]);
  const minute = match[2];
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
};

const inferAnnouncement = (value) => {
  const raw = safeString(value);
  if (!raw) return { title: "", body: "" };
  const parts = raw.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    return {
      title: parts[0].replace(/\s+/g, " ").trim(),
      body: parts.slice(1).join("\n\n"),
    };
  }
  const text = raw.replace(/\s+/g, " ").trim();
  const [firstLine] = text.split(/\n+/);
  return {
    title: "",
    body: firstLine || text,
  };
};

const normalizeAnnouncementItem = (item, fallbackId) => {
  const text = safeString(item?.text || item?.body || item?.message || "");
  const title = safeString(item?.title || item?.label);
  if (!text && !title) return null;
  if (title && text) {
    return {
      id: safeString(item?.id) || fallbackId,
      title,
      body: text,
    };
  }
  const inferred = inferAnnouncement(text || title);
  return {
    id: safeString(item?.id) || fallbackId,
    title: title || inferred.title,
    body: inferred.body || text || title,
  };
};

const asCards = (items, buildCard) => items.map((item, idx) => buildCard(item, idx));

export function normalizeFootballEventData({
  eventData = {},
  eventTitle = "",
} = {}) {
  const customFields = eventData?.customFields || {};
  const advancedSections =
    eventData?.advancedSections ||
    customFields?.advancedSections ||
    {};
  const discoverySource = eventData?.discoverySource || {};
  const parseResult = discoverySource?.parseResult || {};

  const games = pickArray(advancedSections?.games?.games || parseResult?.games);
  const rosterPlayers = pickArray(
    advancedSections?.roster?.players || parseResult?.roster?.players
  );
  const practiceBlocks = pickArray(
    advancedSections?.practice?.blocks || parseResult?.practice?.blocks
  );
  const logistics = advancedSections?.logistics || {};
  const gearItems = pickArray(
    advancedSections?.gear?.items || parseResult?.gear?.checklist
  )
    .map((item) => safeString(item?.name || item?.text || item?.label || item))
    .filter(Boolean);
  const volunteerSlots = pickArray(
    advancedSections?.volunteers?.slots || parseResult?.volunteers?.slots
  );
  const announcementItems = uniqueBy(
    pickArray(advancedSections?.announcements?.items || []).map((item, idx) =>
      normalizeAnnouncementItem(item, `announcement-${idx + 1}`)
    ).filter(Boolean),
    (item) => `${safeString(item?.title)}|${safeString(item?.body)}`
  );
  const isAttendanceEnabled =
    Boolean(eventData?.rsvpEnabled) ||
    Boolean(safeString(eventData?.rsvpDeadline)) ||
    Boolean(eventData?.accessControl?.requirePasscode);
  const passcodeRequired = Boolean(eventData?.accessControl?.requirePasscode);

  const team = safeString(customFields?.team || eventData?.extra?.team);
  const season = safeString(customFields?.season || eventData?.extra?.season);
  const headCoach = safeString(
    customFields?.headCoach || eventData?.extra?.headCoach
  );
  const stadium = safeString(customFields?.stadium || eventData?.extra?.stadium);
  const stadiumAddress = safeString(
    customFields?.stadiumAddress || eventData?.extra?.stadiumAddress
  );

  const summaryItems = [
    team ? { label: "Team", value: team } : null,
    season ? { label: "Season", value: season } : null,
    headCoach ? { label: "Coach", value: headCoach } : null,
    stadium ? { label: "Stadium", value: stadium } : null,
    stadiumAddress ? { label: "Address", value: stadiumAddress } : null,
  ].filter(Boolean);

  const sections = [
    {
      id: "games",
      label: "Game Schedule",
      eyebrow: "Schedule",
      hasContent: games.length > 0,
      cards: asCards(games, (game, idx) => ({
        id: safeString(game?.id) || `game-${idx + 1}`,
        title: compactJoin([
          game?.homeAway === "away" ? `at ${game?.opponent || "TBD"}` : `vs ${game?.opponent || "TBD"}`,
        ]),
        body: compactJoin([
          [formatDate(game?.date), formatTime(game?.time)].filter(Boolean).join(" at "),
          game?.venue || "",
          game?.address || "",
        ]),
        meta: game?.result ? `${game.result}${game.score ? ` ${game.score}` : ""}` : "",
        details: [
          game?.conference ? "Conference game" : "",
          game?.broadcast ? `Broadcast: ${game.broadcast}` : "",
          game?.ticketsLink ? `Tickets: ${game.ticketsLink}` : "",
          game?.notes || "",
        ].filter(Boolean),
      })),
    },
    {
      id: "roster",
      label: "Team Roster",
      eyebrow: "Attendance",
      hasContent: rosterPlayers.length > 0,
      cards: asCards(rosterPlayers, (player, idx) => ({
        id: safeString(player?.id) || `player-${idx + 1}`,
        title: safeString(player?.name) || "Unnamed player",
        body: compactJoin([
          player?.jerseyNumber ? `#${player.jerseyNumber}` : "",
          player?.position || "",
          player?.grade || "",
        ]),
        meta: player?.status ? String(player.status).toUpperCase() : "",
        details: [
          player?.parentName ? `Parent: ${player.parentName}` : "",
          player?.parentPhone ? `Phone: ${player.parentPhone}` : "",
          player?.parentEmail ? `Email: ${player.parentEmail}` : "",
          player?.medicalNotes ? `Medical: ${player.medicalNotes}` : "",
        ].filter(Boolean),
      })),
    },
    {
      id: "practice",
      label: "Practice Schedule",
      eyebrow: "Prep",
      hasContent: practiceBlocks.length > 0,
      cards: asCards(practiceBlocks, (block, idx) => ({
        id: safeString(block?.id) || `practice-${idx + 1}`,
        title: compactJoin([
          block?.day || "",
          [formatTime(block?.startTime), formatTime(block?.endTime)]
            .filter(Boolean)
            .join(" - "),
        ]),
        body: block?.focus || "",
        meta: compactJoin([
          block?.arrivalTime ? `Arrive ${formatTime(block.arrivalTime)}` : "",
          block?.type ? String(block.type).replace(/_/g, " ") : "",
        ]),
        details: [
          Array.isArray(block?.positionGroups) && block.positionGroups.length
            ? `Groups: ${block.positionGroups.join(", ")}`
            : "",
          block?.film ? "Film session included" : "",
        ].filter(Boolean),
      })),
    },
    {
      id: "logistics",
      label: "Travel & Logistics",
      eyebrow: "Game Day",
      hasContent: Boolean(
        safeString(logistics?.travelMode) ||
          safeString(logistics?.callTime) ||
          safeString(logistics?.departureTime) ||
          safeString(logistics?.pickupWindow) ||
          safeString(logistics?.hotelName) ||
          safeString(logistics?.mealPlan) ||
          safeString(logistics?.weatherPolicy) ||
          safeString(logistics?.parking) ||
          safeString(logistics?.broadcast) ||
          safeString(logistics?.ticketsLink) ||
          pickArray(logistics?.notes).length
      ),
      cards: [
        logistics?.travelMode
          ? {
              id: "travel-mode",
              title: "Travel Mode",
              body: String(logistics.travelMode).replace(/_/g, " "),
            }
          : null,
        logistics?.callTime || logistics?.departureTime || logistics?.pickupWindow
          ? {
              id: "timing",
              title: "Timing",
              body: compactJoin([
                logistics?.callTime ? `Call ${formatTime(logistics.callTime)}` : "",
                logistics?.departureTime
                  ? `Depart ${formatTime(logistics.departureTime)}`
                  : "",
                logistics?.pickupWindow || "",
              ]),
            }
          : null,
        logistics?.hotelName || logistics?.hotelAddress
          ? {
              id: "hotel",
              title: "Hotel",
              body: compactJoin([logistics?.hotelName || "", logistics?.hotelAddress || ""], " • "),
            }
          : null,
        logistics?.mealPlan
          ? { id: "meal-plan", title: "Meal Plan", body: logistics.mealPlan }
          : null,
        logistics?.weatherPolicy
          ? {
              id: "weather-policy",
              title: "Weather Policy",
              body: logistics.weatherPolicy,
            }
          : null,
        logistics?.parking
          ? { id: "parking", title: "Parking", body: logistics.parking }
          : null,
        logistics?.broadcast
          ? { id: "broadcast", title: "Broadcast", body: logistics.broadcast }
          : null,
        logistics?.ticketsLink
          ? { id: "tickets", title: "Tickets", body: logistics.ticketsLink }
          : null,
        pickArray(logistics?.notes).length
          ? {
              id: "logistics-notes",
              title: "Notes",
              body: pickArray(logistics?.notes).join("\n"),
            }
          : null,
      ].filter(Boolean),
    },
    {
      id: "gear",
      label: "Equipment Checklist",
      eyebrow: "Gear",
      hasContent: Boolean(safeString(advancedSections?.gear?.uniform) || gearItems.length > 0),
      cards: [
        safeString(advancedSections?.gear?.uniform)
          ? {
              id: "uniform",
              title: "Uniform",
              body: safeString(advancedSections?.gear?.uniform),
            }
          : null,
        gearItems.length
          ? {
              id: "checklist",
              title: "Checklist",
              body: gearItems.join("\n"),
            }
          : null,
      ].filter(Boolean),
    },
    {
      id: "volunteers",
      label: "Parent Volunteers",
      eyebrow: "Community",
      hasContent: volunteerSlots.length > 0 || Boolean(advancedSections?.volunteers?.notes),
      cards: [
        ...asCards(volunteerSlots, (slot, idx) => ({
          id: safeString(slot?.id) || `volunteer-${idx + 1}`,
          title: safeString(slot?.role) || "Volunteer",
          body: compactJoin([
            slot?.gameDate ? formatDate(slot.gameDate) : "",
            slot?.name || "",
          ]),
          meta: slot?.filled ? "Filled" : "Open",
        })),
        advancedSections?.volunteers?.notes
          ? {
              id: "volunteer-notes",
              title: "Volunteer Notes",
              body: safeString(advancedSections.volunteers.notes),
            }
          : null,
        advancedSections?.volunteers?.signupLink
          ? {
              id: "volunteer-link",
              title: "Volunteer Sign-Up",
              body: safeString(advancedSections.volunteers.signupLink),
            }
          : null,
      ].filter(Boolean),
    },
    {
      id: "announcements",
      label: "Announcements",
      eyebrow: "Updates",
      hasContent: announcementItems.length > 0,
      cards: asCards(announcementItems, (item, idx) => ({
        id: safeString(item?.id) || `announcement-${idx + 1}`,
        title: safeString(item?.title) || "Announcement",
        body: safeString(item?.body),
      })),
    },
    {
      id: "attendance",
      label: "Attendance",
      eyebrow: "Response",
      hasContent: isAttendanceEnabled || passcodeRequired,
      cards: [
        {
          id: "attendance-status",
          title: isAttendanceEnabled ? "Attendance is enabled" : "Attendance is hidden",
          body: isAttendanceEnabled
            ? safeString(eventData?.rsvpDeadline)
              ? `Responses due by ${formatDate(eventData.rsvpDeadline)}`
              : "Parents and athletes can confirm attendance here."
            : "This page is read-only until attendance tracking is enabled.",
          meta: passcodeRequired ? "Passcode protected" : "Public access",
          details: [
            safeString(eventData?.rsvpDeadline)
              ? `Response deadline: ${formatDate(eventData.rsvpDeadline)}`
              : "",
            passcodeRequired
              ? "Passcode required to view full details."
              : "No passcode required.",
          ].filter(Boolean),
        },
      ],
    },
  ];

  const navItems = sections.filter((section) => section.hasContent).map((section) => ({
    id: section.id,
    label: section.label,
  }));

  return {
    title: safeString(eventData?.title || eventTitle || eventData?.customFields?.team || "Football Event"),
    subtitle: compactJoin([team, season, headCoach], " • "),
    dateLabel: formatDate(eventData?.date || eventData?.startISO) || safeString(parseResult?.dates),
    timeLabel: formatTime(eventData?.time || ""),
    locationLabel: compactJoin([stadium || safeString(eventData?.venue), stadiumAddress], " • "),
    summaryItems,
    sections,
    navItems,
    attendance: {
      enabled: isAttendanceEnabled,
      visible: isAttendanceEnabled || passcodeRequired,
      deadline: safeString(eventData?.rsvpDeadline),
      helperText: isAttendanceEnabled
        ? "Attendance tracking is available for this football event."
        : "Attendance tracking is currently hidden.",
      passcodeRequired,
      passcodeLabel: passcodeRequired ? "Passcode required" : "Public access",
      passcodeHint: passcodeRequired
        ? "Use the access code shared by the organizer."
        : "No access code is required to view this page.",
    },
  };
}
