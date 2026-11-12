import { ARSENAL, type ArsenalDomain } from '../../data/arsenal.ts';

export type OrbitRing = 0 | 1;

export interface OrbitNode {
  readonly domainId: ArsenalDomain['id'];
  readonly name: string;
  readonly ring: OrbitRing;
  readonly angle: number;
  readonly x: number;
  readonly y: number;
}

/** Semi-axes of the inner and outer ellipse, in scene units centred on the origin. */
export const ORBIT_ELLIPSES = [
  { rx: 1, ry: 0.55 },
  { rx: 1.7, ry: 0.95 },
] as const;

export function layoutOrbit(arsenal: readonly ArsenalDomain[] = ARSENAL): OrbitNode[] {
  const skills = arsenal.flatMap((domain) => domain.skills.map((skill) => ({ domainId: domain.id, name: skill.name })));
  const ringSizes = [Math.ceil(skills.length / 2), Math.floor(skills.length / 2)];
  return skills.map((skill, position) => {
    const ring = (position % 2) as OrbitRing;
    const slot = Math.floor(position / 2);
    const step = (2 * Math.PI) / ringSizes[ring];
    const angle = slot * step + (ring * step) / 2;
    const { rx, ry } = ORBIT_ELLIPSES[ring];
    return { ...skill, ring, angle, x: rx * Math.cos(angle), y: ry * Math.sin(angle) };
  });
}
