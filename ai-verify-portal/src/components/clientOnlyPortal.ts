import { useRef, useEffect, useState, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

type ClientOnlyPortalProps = {
  selector: string;
};

function ClientOnlyPortal(props: PropsWithChildren<ClientOnlyPortalProps>) {
  const { children, selector } = props;
  const ref = useRef<Element | null>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ref.current = document.querySelector(selector);
    setMounted(true);
  }, [selector]);

  return mounted && ref.current ? createPortal(children, ref.current) : null;
}

export { ClientOnlyPortal };
