const noop = () => {};
const sidebar = {
  setSelectedEventId: noop,
  setSelectedEventTitle: noop,
  setSelectedEventHref: noop,
  setSelectedEventOwnerHref: noop,
  setSelectedEventEditHref: noop,
  setActiveEventTab: noop,
};
export const useSidebar = () => sidebar;
