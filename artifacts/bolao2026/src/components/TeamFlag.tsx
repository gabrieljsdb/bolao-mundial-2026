import React from 'react';

// Mapeamento de códigos ISO 3166-1 alpha-2 para as seleções da Copa 2026
// Muitos códigos batem com o ID do time, outros precisam de ajuste
const ISO_MAP: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct',
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  ESP: 'es', CPV: 'cv', KSA: 'sa', URY: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa'
};

interface TeamFlagProps {
  teamId: string;
  className?: string;
  fallback?: string;
}

export const TeamFlag: React.FC<TeamFlagProps> = ({ teamId, className = "w-6 h-4", fallback }) => {
  const isoCode = ISO_MAP[teamId];
  
  if (!isoCode) {
    return <span className={className}>{fallback}</span>;
  }

  // Usando FlagCDN (serviço gratuito e estável)
  // O código para Escócia e Inglaterra no FlagCDN segue o padrão gb-sct e gb-eng
  const flagUrl = `https://flagcdn.com/w40/${isoCode.toLowerCase()}.png`;

  return (
    <img 
      src={flagUrl} 
      alt={teamId}
      className={`inline-block object-contain ${className}`}
      onError={(e) => {
        // Se a imagem falhar, mostra o emoji de fallback
        (e.target as HTMLImageElement).style.display = 'none';
        if (fallback) {
          const span = document.createElement('span');
          span.textContent = fallback;
          (e.target as HTMLElement).parentNode?.appendChild(span);
        }
      }}
    />
  );
};
