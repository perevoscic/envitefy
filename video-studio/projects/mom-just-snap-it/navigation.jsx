import React from 'react';
const params=new URLSearchParams(location.search);
export const useSearchParams=()=>params;
export const useRouter=()=>({replace:()=>{},push:()=>{},refresh:()=>{},back:()=>{}});
export const usePathname=()=>'/chat';
export const useParams=()=>({});
