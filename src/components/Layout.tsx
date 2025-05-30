import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, HomeIcon, CalendarIcon, ClipboardDocumentCheckIcon, BanknotesIcon, UserGroupIcon, BuildingStorefrontIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Checklist', href: '/checklist', icon: ClipboardDocumentCheckIcon },
  { name: 'Budget', href: '/budget', icon: BanknotesIcon },
  { name: 'Guests', href: '/guests', icon: UserGroupIcon },
  { name: 'Vendors', href: '/vendors', icon: BuildingStorefrontIcon },
  { name: 'Setup', href: '/setup', icon: Cog6ToothIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('initial');
  const [transitionClass, setTransitionClass] = useState('');
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  // Handle page transitions
  useEffect(() => {
    const currentPathIndex = navigation.findIndex(item => item.href === pathname);
    const previousPathIndex = navigation.findIndex(item => item.href === previousPathname.current);

    let enterClass = '';
    const pagesWithSmootherEntrance = ['/dashboard', '/calendar', '/checklist', '/setup'];

    // Determine transition class
    if (pagesWithSmootherEntrance.includes(pathname)) {
      // Use a smoother fade-in from a slight vertical offset for these specific pages
      if (currentPathIndex !== -1 && previousPathIndex !== -1) {
         // Determine slight direction based on navigation index difference
         if (currentPathIndex > previousPathIndex) {
            enterClass = 'opacity-0 translate-y-4'; // Fade in slightly from below
         } else {
            enterClass = 'opacity-0 -translate-y-4'; // Fade in slightly from above
         }
      } else {
         // Default subtle fade-in for initial load or if previous not found
         enterClass = 'opacity-0 -translate-y-4';
      }
    } else if (currentPathIndex !== -1 && previousPathIndex !== -1) {
      // Use full vertical swipe for other pages in the navigation list
      if (currentPathIndex > previousPathIndex) {
        // Navigating deeper - swipe up
        enterClass = 'opacity-0 translate-y-full'; // Start from bottom
      } else {
        // Navigating upward - swipe down
        enterClass = 'opacity-0 -translate-y-full'; // Start from top
      }
    } else {
       // Fallback for navigation to/from pages not in navigation list (e.g., login)
       enterClass = 'opacity-0 -translate-y-4'; // Simple fade-in from slightly above
    }

    setTransitionClass(enterClass);

    // Set initial animation phase
    setAnimationPhase('initial');

    // Use a small timeout to allow initial classes to apply before transitioning
    const timeoutId = setTimeout(() => {
      setAnimationPhase('transitioning');
    }, 50); // Small delay

    // Clean up timeout on component unmount or pathname change
    return () => clearTimeout(timeoutId);

  }, [pathname]); // Depend on pathname to trigger effect on route change

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFE5EC]">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#ffafcc] px-6 pb-4">
                  {/* Logo Container */}
                  <div className="flex flex-col items-center text-center mt-6 mb-4">
                    <h1 className="text-3xl font-gitalian text-white">Wedding Planner</h1>
                  </div>
                  
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="space-y-4">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={`
                                  flex flex-col items-center text-center gap-2 rounded-md p-3
                                  transition-all duration-200 ease-in-out
                                  ${pathname === item.href
                                    ? 'bg-pink-600 text-white shadow-md'
                                    : 'text-white hover:bg-pink-500 hover:shadow-sm'
                                  }
                                `}
                              >
                                <item.icon className="h-6 w-6" aria-hidden="true" />
                                <span className="text-sm font-medium">{item.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#ffafcc] px-6 pb-4">
          {/* Logo Container */}
          <div className="flex flex-col items-center text-center mt-6 mb-4">
            <h1 className="text-3xl font-gitalian text-white">Wedding Planner</h1>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="space-y-4">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          flex flex-col items-center text-center gap-2 rounded-md p-3
                          transition-all duration-200 ease-in-out
                          ${pathname === item.href
                            ? 'bg-pink-600 text-white shadow-md'
                            : 'text-white hover:bg-pink-500 hover:shadow-sm'
                          }
                        `}
                      >
                        <item.icon className="h-6 w-6" aria-hidden="true" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                onClick={handleLogout}
                className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-600 active:scale-95 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div 
              key={pathname}
              className={`
                relative
                transition-all duration-500 ease-in-out
                ${animationPhase === 'initial' ? transitionClass : 'opacity-100 translate-y-0'}
                will-change-transform,opacity
              `}
            >
              <h1 className="page-title">
                {(() => {
                  const path = pathname.split('/').pop();
                  return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
                })()}
              </h1>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}