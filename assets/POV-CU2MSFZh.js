import{r as b,j as e}from"./index-yEuACr2w.js";const C=[{id:1,titre:"FLUX RÉSIDUEL 01 — CÉRÉMONIE SANS NOM",url:"https://www.youtube.com/embed/i2LhE_Yz1z8?si=8BCEUqGwB6AKCH-1",prixLicence:500},{id:2,titre:"FLUX RÉSIDUEL 02 — ARCHIVE CLANDESTINE",url:"https://www.youtube.com/embed/6PyaRuJHtGU?si=-Z9HucEg8vu662pw",prixLicence:500},{id:3,titre:"FLUX RÉSIDUEL 03 — SIGNAL PARASITE",url:"https://www.youtube.com/embed/7knilPs8Vqc?si=DgM19UvUQkogxhha",prixLicence:500},{id:4,titre:"FLUX RÉSIDUEL 04 — ENREGISTREMENT INTERDIT",url:"https://www.youtube.com/embed/uNEUhjDD0pc?si=bV34Zsyp2Zvx63AI",prixLicence:500},{id:5,titre:"FLUX RÉSIDUEL 05 — TRANSMISSION FANTÔME",url:"https://www.youtube.com/embed/QF_7ILpVSLg?si=bOfsmMyRoChSKpG1",prixLicence:500},{id:6,titre:"FLUX RÉSIDUEL 06 — BOUCLE SANS FIN",url:"https://www.youtube.com/embed/nc5TVNZrmoY?si=gE0E8o4Ufgvb_4Zu",prixLicence:500}];function U({soldeActuel:o,effectuerTransaction:a,fmt:l,inflationRate:r,pushToInventaire:w,unlockedChannels:u=[],setUnlockedChannels:S=()=>{}}){const[n,m]=b.useState(!1),[s,k]=b.useState(window.innerWidth<768),[t,g]=b.useState(null),[L,j]=b.useState(0),c=2*r,h=1*r,x=Math.round(5*r),I=()=>{if(n)m(!1),g(null);else{if(o<c)return;a("Allumage terminal POV",c),m(!0)}},E=i=>{if(n){if(u.includes(i.id)){if(o<x)return;a(`DIFFUSION CANAL ${i.id}`,x)}else{if(o<h)return;a(`ZAPPING CANAL ${i.id}`,h)}g(i),j(d=>d+1)}},y=i=>{const d=i.prixLicence*r;o<d||(a(`Licence canal ${i.id}: ${i.titre}`,d),w({id:"vod-"+i.id+"-"+Date.now(),type:"video",titre:"Licence VOD: "+i.titre,src:i.url,prixAchat:d}),S(p=>[...p,i.id]))},f=i=>u.includes(i.id),N=()=>n?t?f(t)?e.jsx("div",{style:{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("iframe",{src:t.url,title:t.titre,frameBorder:"0",allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",referrerPolicy:"strict-origin-when-cross-origin",allowFullScreen:!0,style:{width:"100%",height:"100%",border:"none",display:"block"}},L)}):e.jsxs("div",{style:{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px"},children:[e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"10px",color:"#f6a623",letterSpacing:"0.3em"},children:"⚠ CANAL CRYPTÉ"}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"13px",color:"#666",letterSpacing:"0.2em"},children:"LICENCE REQUISE"}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"9px",color:"#444",textAlign:"center",maxWidth:"300px"},children:t.titre}),e.jsxs("button",{onClick:()=>y(t),disabled:o<t.prixLicence*r,style:{background:"transparent",border:"1px solid #f6a623",color:"#f6a623",fontFamily:"var(--font-mono)",fontSize:"10px",padding:"10px 18px",cursor:o>=t.prixLicence*r?"pointer":"not-allowed",letterSpacing:"0.15em",opacity:o<t.prixLicence*r?.4:1,animation:"btnPulse 2s ease-in-out infinite"},children:["ACQUÉRIR LA LICENCE [-",l(t.prixLicence*r)," €]"]})]}):e.jsxs("div",{style:{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"12px"},children:[e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"13px",color:"#555",letterSpacing:"0.25em"},children:"EN ATTENTE DE SIGNAL"}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"9px",color:"#333",letterSpacing:"0.15em"},children:"░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"})]}):e.jsxs("div",{style:{width:"100%",height:"100%",background:"#1a1a1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"},children:[e.jsx("div",{style:{width:"10px",height:"10px",background:"#ff2222",boxShadow:"0 0 8px #ff2222, 0 0 18px #ff0000",animation:"diodePulse 2s ease-in-out infinite"}}),e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontSize:"11px",color:"#333",letterSpacing:"0.3em"},children:"HORS TENSION"})]});return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @keyframes diodePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 0px #f6a623; }
          50% { box-shadow: 0 0 10px rgba(246,166,35,0.4); }
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
        .pov-btn-power {
          border-color: #ff2222;
          color: #ff2222;
        }
        .pov-btn-power:not(:disabled):hover {
          border-color: #ff5555;
          color: #ff5555;
          box-shadow: 0 0 10px rgba(255,34,34,0.3);
        }
        .pov-btn-power-on {
          border-color: #39ff6a !important;
          color: #39ff6a !important;
          box-shadow: 0 0 10px rgba(57,255,106,0.3) !important;
        }
        .pov-btn-unlock {
          border-color: #f6a623 !important;
          color: #f6a623 !important;
        }
        .pov-btn-unlock:not(:disabled):hover {
          box-shadow: 0 0 10px rgba(246,166,35,0.3);
        }
      `}),e.jsx("div",{style:{flex:1,width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#08080a",padding:s?"0":"40px"},children:e.jsx("div",{style:{width:"100%",maxWidth:"900px",height:"100%",maxHeight:s?"none":"800px",display:"flex",flexDirection:"column",background:"#2a2a2a",border:s?"none":"1px solid #333",borderRadius:"0",boxShadow:s?"none":"0 25px 60px rgba(0,0,0,0.8)",overflow:"hidden",position:"relative"},children:e.jsx("div",{style:{flex:1,display:"flex",overflow:"hidden",position:"relative",minHeight:0},children:e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",minHeight:0},children:[e.jsxs("div",{style:{flex:1,minHeight:0,position:"relative",background:"#1a1a1a",border:n&&t&&f(t)?"1px solid #39ff6a":"1px solid #111",margin:"12px 12px 0 12px",overflow:"hidden",boxShadow:n&&t&&f(t)?"0 0 20px rgba(57,255,106,0.15), inset 0 0 30px rgba(0,0,0,0.5)":"none"},children:[N(),e.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)",zIndex:12}})]}),e.jsxs("div",{style:{flexShrink:0,borderTop:"1px solid #111",background:"#222",padding:"12px 16px",paddingBottom:s?"100px":"16px",overflowY:"auto"},children:[e.jsxs("div",{style:{display:"flex",gap:"6px",marginBottom:"12px",alignItems:"center",flexWrap:"wrap"},children:[e.jsxs("button",{className:`pov-btn pov-btn-power${n?" pov-btn-power-on":""}`,onClick:I,disabled:!n&&o<c,style:{fontSize:"9px",padding:"5px 10px"},children:["⏻ ",n?"OFF":`ON [-${l(c)} €]`]}),t&&e.jsxs("div",{style:{marginLeft:"auto",fontFamily:"var(--font-mono)",fontSize:"8px",color:"#444",letterSpacing:"0.1em"},children:["CH.0",t.id]})]}),e.jsx("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"},children:C.map(i=>{const d=f(i),p=t?.id===i.id,v=i.prixLicence*r;return d?e.jsx("button",{className:`pov-btn${p?" pov-btn-active":""}`,onClick:()=>E(i),disabled:!n||o<x,title:i.titre,style:{fontSize:"8px",padding:"6px 10px"},children:s?`C${i.id} ${p?"●":"○"}`:`CANAL ${i.id} ${p?"●":"○"}`},i.id):e.jsx("button",{className:"pov-btn pov-btn-unlock",onClick:()=>y(i),disabled:o<v,title:i.titre,style:{fontSize:"8px",padding:"6px 10px"},children:s?`🔒 C${i.id}`:`🔒 CANAL ${i.id} [-${l(v)} €]`},i.id)})}),e.jsxs("div",{style:{display:"flex",gap:"15px",fontFamily:"var(--font-mono)",fontSize:"8px",color:"#555",letterSpacing:"0.08em"},children:[e.jsxs("span",{children:["ZAP: -",l(h)," €"]}),e.jsxs("span",{children:["DIFFUSION: -",l(x)," €"]})]})]})]})})})})]})}export{U as default};
