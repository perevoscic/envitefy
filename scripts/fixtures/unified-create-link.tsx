import { useRouter } from "./signup-editor/navigation";
export default function Link({ href, children, onClick, ...props }: any) {
  const router = useRouter();
  return <a {...props} href={href} onClick={event => { onClick?.(event); if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !props.target) { event.preventDefault(); router.push(String(href)); } }}>{children}</a>;
}
