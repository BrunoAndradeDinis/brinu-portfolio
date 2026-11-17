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
  operatorId: 'BAD-1996',
  role: {
    'pt-br': 'Desenvolvedor Frontend & Full Stack',
    en: 'Frontend & Full Stack Developer',
  },
  tagline: {
    'pt-br': 'Sistemas Web Full Stack • De interfaces rápidas a APIs e bancos de dados',
    en: 'Full Stack Web Systems • From fast interfaces to APIs and databases',
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
    'pt-br': 'Sistemas Web Sob Medida & Projetos Full Stack',
    en: 'Custom Web Systems & Full Stack Projects',
  },
  stampLabel: {
    'pt-br': 'Brinu!',
    en: 'Brinu!',
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
  readonly jobTitle: string;
  readonly email: string;
  readonly address: {
    readonly '@type': 'PostalAddress';
    readonly addressLocality: 'Franca';
    readonly addressRegion: 'SP';
    readonly addressCountry: 'BR';
  };
  readonly worksFor: {
    readonly '@type': 'Organization';
    readonly name: string;
    readonly url: string;
  };
  readonly knowsAbout: readonly string[];
  readonly sameAs: readonly string[];
}

const KNOWS_ABOUT = [
  'Frontend development',
  'Full stack development',
  'React',
  'Next.js',
  'Astro',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Tailwind CSS',
  'GSAP',
] as const;

export function buildPersonJsonLd(): PersonJsonLdContract {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PROFILE.fullName,
    alternateName: PROFILE.handle,
    jobTitle: PROFILE.role.en,
    email: PROFILE.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: PROFILE.location.city,
      addressRegion: PROFILE.location.state,
      addressCountry: 'BR',
    },
    worksFor: {
      '@type': 'Organization',
      name: 'Magalu Cloud',
      url: 'https://magalu.cloud/',
    },
    knowsAbout: KNOWS_ABOUT,
    sameAs: [PROFILE.github.url, PROFILE.linkedin.url],
  };
}
