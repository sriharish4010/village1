import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface LocationState {
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
}

export interface RouterContextType {
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

/**
 * Normalizes path from window.location, handling both pathname and hash routes
 */
function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';

  // Support hash routing fallback if hash starts with #/ or #admin
  const hash = window.location.hash;
  if (hash.startsWith('#/')) {
    return hash.slice(1); // e.g. '#/admin' -> '/admin'
  }
  if (hash === '#admin') {
    return '/admin/governance';
  }

  const path = window.location.pathname || '/';
  return path === '' ? '/' : path;
}

export const Router: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(getCurrentPath);
  const [search, setSearch] = useState<string>(() => (typeof window !== 'undefined' ? window.location.search : ''));
  const [hash, setHash] = useState<string>(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(getCurrentPath());
      setSearch(window.location.search);
      setHash(window.location.hash);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    // Handle hash aliases
    let target = to;
    if (target === '#admin') target = '/admin/governance';
    if (target.startsWith('#/')) target = target.slice(1);

    if (options?.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }

    setPathname(getCurrentPath());
    setSearch(window.location.search);
    setHash(window.location.hash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const value = useMemo(
    () => ({
      pathname,
      search,
      hash,
      params,
      navigate,
    }),
    [pathname, search, hash, params, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a <Router>');
  }
  return ctx;
}

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

export function useLocation() {
  const { pathname, search, hash } = useRouter();
  return { pathname, search, hash };
}

const RouteContext = createContext<Record<string, string>>({});

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useContext(RouteContext) as T;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
}

export const Link: React.FC<LinkProps> = ({ to, replace, onClick, children, ...rest }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to, { replace });
    }
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};

interface RouteMatch {
  matches: boolean;
  params: Record<string, string>;
}

function matchPath(pattern: string, currentPath: string): RouteMatch {
  if (pattern === '*' || pattern === '404') {
    return { matches: true, params: {} };
  }

  // Exact root match
  if (pattern === '/' && (currentPath === '/' || currentPath === '')) {
    return { matches: true, params: {} };
  }

  const patternParts = pattern.split('/').filter(Boolean);
  const currentParts = currentPath.split('/').filter(Boolean);

  if (patternParts.length !== currentParts.length) {
    return { matches: false, params: {} };
  }

  const extractedParams: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pPart = patternParts[i];
    const cPart = currentParts[i];

    if (pPart.startsWith(':')) {
      const paramName = pPart.slice(1);
      extractedParams[paramName] = decodeURIComponent(cPart);
    } else if (pPart !== cPart) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params: extractedParams };
}

export interface RouteProps {
  path: string;
  element: React.ReactNode;
}

export const Route: React.FC<RouteProps> = () => null;

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useRouter();

  const routeChildren = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<RouteProps> => React.isValidElement(child)
  );

  for (const child of routeChildren) {
    const match = matchPath(child.props.path, pathname);
    if (match.matches) {
      return <RouteContext.Provider value={match.params}>{child.props.element}</RouteContext.Provider>;
    }
  }

  return null;
};
