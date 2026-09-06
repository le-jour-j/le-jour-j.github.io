import{r as p,j as i}from"./index-Cn7u_494.js";const C=[{id:1,titre:"FLUX RÉSIDUEL 01 — CÉRÉMONIE SANS NOM",url:"https://www.youtube.com/embed/i2LhE_Yz1z8?si=8BCEUqGwB6AKCH-1",prixLicence:500},{id:2,titre:"FLUX RÉSIDUEL 02 — ARCHIVE CLANDESTINE",url:"https://www.youtube.com/embed/6PyaRuJHtGU?si=-Z9HucEg8vu662pw",prixLicence:500},{id:3,titre:"FLUX RÉSIDUEL 03 — SIGNAL PARASITE",url:"https://www.youtube.com/embed/7knilPs8Vqc?si=DgM19UvUQkogxhha",prixLicence:500},{id:4,titre:"FLUX RÉSIDUEL 04 — ENREGISTREMENT INTERDIT",url:"https://www.youtube.com/embed/uNEUhjDD0pc?si=bV34Zsyp2Zvx63AI",prixLicence:500},{id:5,titre:"FLUX RÉSIDUEL 05 — TRANSMISSION FANTÔME",url:"https://www.youtube.com/embed/QF_7ILpVSLg?si=bOfsmMyRoChSKpG1",prixLicence:500},{id:6,titre:"FLUX RÉSIDUEL 06 — BOUCLE SANS FIN",url:"https://www.youtube.com/embed/nc5TVNZrmoY?si=gE0E8o4Ufgvb_4Zu",prixLicence:500}],k=.15,R=5;function O({soldeActuel:l,effectuerTransaction:c,fmt:h,inflationRate:a,pushToInventaire:v,unlockedChannels:S=[],setUnlockedChannels:w=()=>{},povZapCount:L=0,setPovZapCount:u=()=>{},globalInventaire:b=[],navigate:N=()=>{}}){const[r,F]=p.useState(window.innerWidth<768),[t,x]=p.useState(null);p.useEffect(()=>{t&&!b.some(e=>e.refId===t.id)&&(x(null),N("compensation"))},[b]);const[I,m]=p.useState(0),E=5*a,g=Math.min(Math.pow(1+k,L),R),n=Math.round(E*g),A=e=>{l<n||(c(`DIFFUSION CANAL ${e.id}`,n),u(o=>o+1),x(e),m(o=>o+1))},j=e=>{const o=e.prixLicence*a,d=o+n;l<d||(c(`Licence canal ${e.id}: ${e.titre}`,o),v({id:"vod-"+e.id+"-"+Date.now(),refId:e.id,type:"video",titre:"Licence VOD: "+e.titre,src:e.url,prixAchat:o}),w(s=>[...s,e.id]),c(`DIFFUSION CANAL ${e.id}`,n),u(s=>s+1),x(e),m(s=>s+1))},f=e=>S.includes(e.id),U=()=>t?i.jsx("div",{style:{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center"},children:i.jsx("iframe",{src:t.url,title:t.titre,frameBorder:"0",allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",referrerPolicy:"strict-origin-when-cross-origin",allowFullScreen:!0,style:{width:"100%",height:"100%",border:"none",display:"block"}},I)}):i.jsxs("div",{style:{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"},children:[i.jsx("div",{style:{width:"10px",height:"10px",background:"#ff2222",boxShadow:"0 0 8px #ff2222, 0 0 18px #ff0000",animation:"diodePulse 2s ease-in-out infinite"}}),i.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"11px",color:"#333",letterSpacing:"0.3em"},children:"HORS TENSION"}),i.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"9px",color:"#333",letterSpacing:"0.15em"},children:"SÉLECTIONNER UN CANAL POUR ÉTABLIR LE SIGNAL"})]});return i.jsxs(i.Fragment,{children:[i.jsx("style",{children:`
        @keyframes diodePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .pov-btn {
          background: #222;
          border: 1px solid #333;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 8px 12px;
          cursor: pointer;
          letter-spacing: 0.12em;
          transition: border-color 0.15s, color 0.15s, box-shadow 0.15s;
          position: relative;
          overflow: hidden;
        }
        .pov-btn:not(:disabled):hover {
          border-color: #39ff6a;
          color: #39ff6a;
        }
        .pov-btn:not(:disabled):active {
          background: rgba(57,255,106,0.08);
        }
        .pov-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .pov-btn-active {
          border-color: #39ff6a !important;
          color: #39ff6a !important;
          box-shadow: inset 0 0 8px rgba(57,255,106,0.15);
        }
        .pov-btn-unlock {
          border-color: #f6a623 !important;
          color: #f6a623 !important;
        }
        .pov-btn-unlock:not(:disabled):hover {
          box-shadow: 0 0 10px rgba(246,166,35,0.3);
        }
      `}),i.jsx("div",{style:{flex:1,width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#08080a",padding:r?"0":"40px"},children:i.jsx("div",{style:{width:"100%",maxWidth:"900px",height:"100%",maxHeight:r?"none":"800px",display:"flex",flexDirection:"column",background:"#2a2a2a",border:r?"none":"1px solid #333",borderRadius:"0",boxShadow:r?"none":"0 25px 60px rgba(0,0,0,0.8)",overflow:"hidden",position:"relative"},children:i.jsx("div",{style:{flex:1,display:"flex",overflow:"hidden",position:"relative",minHeight:0},children:i.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",minHeight:0},children:[i.jsxs("div",{style:{flex:1,minHeight:0,position:"relative",background:"#1a1a1a",border:t&&f(t)?"1px solid #39ff6a":"1px solid #111",margin:"12px 12px 0 12px",overflow:"hidden",boxShadow:t&&f(t)?"0 0 20px rgba(57,255,106,0.15), inset 0 0 30px rgba(0,0,0,0.5)":"none"},children:[U(),i.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)",zIndex:12}})]}),i.jsxs("div",{style:{flexShrink:0,borderTop:"1px solid #111",background:"#222",padding:"12px 16px",paddingBottom:r?"var(--mobile-bottom-safe-padding)":"16px",overflowY:"auto"},children:[i.jsxs("div",{style:{display:"flex",gap:"6px",marginBottom:"12px",alignItems:"center",flexWrap:"wrap"},children:[i.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[i.jsx("div",{style:{width:"7px",height:"7px",borderRadius:"50%",background:t?"#39ff6a":"#ff2222",boxShadow:t?"0 0 6px #39ff6a":"0 0 6px #ff2222"}}),i.jsx("span",{style:{fontFamily:"var(--font-mono)",fontSize:"9px",color:"#555",letterSpacing:"0.12em"},children:t?"SIGNAL ACTIF":"AUCUN SIGNAL"})]}),t&&i.jsxs("div",{style:{marginLeft:"auto",fontFamily:"var(--font-mono)",fontSize:"8px",color:"#444",letterSpacing:"0.1em"},children:["CH.0",t.id]})]}),i.jsx("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"},children:C.map(e=>{const o=f(e),d=t?.id===e.id,s=e.prixLicence*a;if(!o){const y=s+n;return i.jsx("button",{className:"pov-btn pov-btn-unlock",onClick:()=>j(e),disabled:l<y,title:`${e.titre} — licence + diffusion`,style:{fontSize:"8px",padding:"6px 10px"},children:r?`🔒 C${e.id}`:`🔒 CANAL ${e.id} [-${h(y)} €]`},e.id)}return i.jsx("button",{className:`pov-btn${d?" pov-btn-active":""}`,onClick:()=>A(e),disabled:l<n,title:e.titre,style:{fontSize:"8px",padding:"6px 10px"},children:r?`C${e.id} ${d?"●":"○"}`:`CANAL ${e.id} ${d?"●":"○"}`},e.id)})}),i.jsxs("div",{style:{display:"flex",gap:"15px",fontFamily:"var(--font-mono)",fontSize:"8px",color:"#555",letterSpacing:"0.08em"},children:[i.jsxs("span",{children:["ZAP: -",h(n)," €"]}),i.jsxs("span",{style:{color:"#ff4444"},children:["SURTENSION: +",Math.round((g-1)*100),"%"]})]})]})]})})})})]})}export{O as default};
