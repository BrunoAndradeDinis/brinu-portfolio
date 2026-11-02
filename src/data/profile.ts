export interface ProfileContract {
  readonly fullName: string;
  readonly handle: string;
  readonly birthYear: number;
  readonly operatorId: string;
  readonly role: {
    readonly 'pt-br': string;
    readonly en: string;
  };
  readonly tagline: {
    readonly 'pt-br': string;
    readonly en: string;
  };
  readonly location: {
    readonly city: 'Franca';
    readonly state: 'SP';
    readonly country: {
      readonly 'pt-br': 'Brasil';
      readonly en: 'Brazil';
    };
    readonly label: 'Franca / SP';
    readonly remoteLabel: {
      readonly 'pt-br': 'Franca / SP • Remoto';
      readonly en: 'Franca / SP • Remote';
    };
  };
  readonly family: {
    readonly 'pt-br': string;
    readonly en: string;
  };
  readonly stampLabel: {
    readonly 'pt-br': string;
    readonly en: string;
  };
  readonly email: 'bruno.a.dinis96@gmail.com';
  readonly github: {
    readonly handle: '@BrunoAndradeDinis';
    readonly url: 'https://github.com/BrunoAndradeDinis';
  };
  readonly linkedin: {
    readonly handle: '/in/bruno-de-andrade-dinis';
    readonly url: 'https://www.linkedin.com/in/bruno-de-andrade-dinis';
  };
}

export const PROFILE = {
  fullName: 'Bruno de Andrade Dinis',
  handle: 'Brinu',
  birthYear: 1996,
  operatorId: 'BD-1996',
  role: {
    'pt-br': 'Engenheiro de Software & Creative Technologist',
    en: 'Software Engineer & Creative Technologist',
  },
  tagline: {
    'pt-br': 'Arquitetura em Nuvem • Sistemas Distribuídos • Interfaces Expressivas',
    en: 'Cloud Architecture • Distributed Systems • Expressive Interfaces',
  },
  location: {
    city: 'Franca',
    state: 'SP',
    country: {
      'pt-br': 'Brasil',
      en: 'Brazil',
    },
    label: 'Franca / SP',
    remoteLabel: {
      'pt-br': 'Franca / SP • Remoto',
      en: 'Franca / SP • Remote',
    },
  },
  family: {
    'pt-br': 'Pai da Helena & Noivo Apaixonado',
    en: "Helena's Dad & Devoted Fiancé",
  },
  stampLabel: {
    'pt-br': 'PAI DA HELENA',
    en: "HELENA'S DAD",
  },
  email: 'bruno.a.dinis96@gmail.com',
  github: {
    handle: '@BrunoAndradeDinis',
    url: 'https://github.com/BrunoAndradeDinis',
  },
  linkedin: {
    handle: '/in/bruno-de-andrade-dinis',
    url: 'https://www.linkedin.com/in/bruno-de-andrade-dinis',
  },
} as const satisfies ProfileContract;

export interface PersonJsonLdContract {
  readonly '@context': 'https://schema.org';
  readonly '@type': 'Person';
  readonly name: string;
  readonly alternateName: string;
  readonly birthDate: string;
  readonly jobTitle: string;
  readonly email: string;
  readonly address: {
    readonly '@type': 'PostalAddress';
    readonly addressLocality: 'Franca';
    readonly addressRegion: 'SP';
    readonly addressCountry: 'BR';
  };
  readonly sameAs: readonly string[];
}

export function buildPersonJsonLd(): PersonJsonLdContract {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PROFILE.fullName,
    alternateName: PROFILE.handle,
    birthDate: String(PROFILE.birthYear),
    jobTitle: PROFILE.role.en,
    email: PROFILE.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: PROFILE.location.city,
      addressRegion: PROFILE.location.state,
      addressCountry: 'BR',
    },
    sameAs: [PROFILE.github.url, PROFILE.linkedin.url],
  };
}
