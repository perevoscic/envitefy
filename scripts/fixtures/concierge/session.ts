export const useSession = () => {
  const requested = new URLSearchParams(window.location.search).get("session");
  const status = requested === "authenticated" || requested === "loading" ? requested : "unauthenticated";
  return { data: null, status };
};
