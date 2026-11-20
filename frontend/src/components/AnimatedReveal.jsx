import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const AnimatedReveal = ({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  y = 24,
  x = 0,
  scale = 0.96,
  stagger = 0,
  as: Component = 'div',
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;

    const targets = stagger > 0 ? Array.from(ref.current.children) : [ref.current];

    gsap.fromTo(
      targets,
      {
        autoAlpha: 0,
        y,
        x,
        scale,
      },
      {
        autoAlpha: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration,
        delay,
        stagger: stagger > 0 ? stagger : 0,
        ease: 'power3.out',
      }
    );

    return () => gsap.killTweensOf(targets);
  }, [delay, duration, scale, stagger, x, y]);

  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
};

export default AnimatedReveal;
