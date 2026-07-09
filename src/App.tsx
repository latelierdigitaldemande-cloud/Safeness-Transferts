/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useMemo, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stripe, loadStripe } from '@stripe/stripe-js';
import L from 'leaflet';
import { 
  MapPin, Navigation, Calendar, Clock, Users, User, Briefcase, Building2,
  ChevronRight, ChevronLeft, ChevronDown, ArrowUpRight, Check, CreditCard, Plane, Tag, Sparkles, Palette,
  Train, Info, ShieldCheck, Star, ArrowRight, ArrowLeft, X, Menu, Plus,
  Phone, Mail, MessageSquare, Globe, Search, Loader2,
  Instagram, Linkedin
} from 'lucide-react';

// Initialize Stripe with the public key from environment
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

if (!STRIPE_PUBLIC_KEY) {
  console.error("Stripe Public Key is missing! Check your .env or Vercel environment variables.");
} else {
  console.log("Stripe Public Key detected on Client: YES");
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Extend JSX namespace for iconify-icon
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': any;
    }
  }
}

const SolarUsersGroup = ({ className, size = 20, strokeWidth = 1.5 }: { className?: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" strokeWidth={strokeWidth}>
      <circle cx="9" cy="6" r="4" />
      <path strokeLinecap="round" d="M15 9a3 3 0 1 0 0-6" />
      <ellipse cx="9" cy="17" rx="7" ry="4" />
      <path strokeLinecap="round" d="M18 14c1.754.385 3 1.359 3 2.5c0 1.03-1.014 1.923-2.5 2.37" />
    </g>
  </svg>
);

const SolarCaseMinimalistic = ({ className, size = 20, strokeWidth = 1.5 }: { className?: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" strokeWidth={strokeWidth}>
      <path d="M14 6h-4c-1.356 0-2.468 0-3.39.054c-1.645.097-2.688.367-3.438 1.118C2 8.343 2 10.229 2 14s0 5.657 1.172 6.828S6.229 22 10 22h4c3.771 0 5.657 0 6.828-1.172S22 17.771 22 14s0-5.657-1.172-6.828c-.75-.75-1.793-1.02-3.437-1.118C16.468 6 15.356 6 14 6Z" />
      <path d="M6.61 6.054c.823-.02 1.55-.6 1.83-1.374l.035-.103L8.5 4.5c.042-.127.064-.19.086-.246a2 2 0 0 1 1.735-1.25C10.38 3 10.448 3 10.58 3h2.838c.133 0 .2 0 .26.004a2 2 0 0 1 1.735 1.25c.023.056.044.12.086.246l.026.077c.018.053.026.08.035.103c.28.775 1.007 1.354 1.83 1.374" />
      <path strokeLinecap="round" d="M21.662 8.72c-3.01 1.956-4.515 2.934-6.101 3.427a12 12 0 0 1-7.121 0c-1.587-.493-3.092-1.47-6.102-3.427M8 11v2m8-2v2" />
    </g>
  </svg>
);

const SolarWifiRouter = ({ className, size = 20, strokeWidth = 1.5 }: { className?: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <g>
      <path fill="currentColor" d="M7 15a1 1 0 1 1-2 0a1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0a1 1 0 0 1 2 0" />
      <path stroke="currentColor" strokeWidth={strokeWidth} d="M2 15c0-1.886 0-2.828.586-3.414S4.114 11 6 11h12c1.886 0 2.828 0 3.414.586S22 13.114 22 15s0 2.828-.586 3.414S19.886 19 18 19H6c-1.886 0-2.828 0-3.414-.586S2 16.886 2 15Z" />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth={strokeWidth} d="M7 11L3 4m14 7l4-7m-7 11h4m-.833-9.603A5.502 5.502 0 0 0 7 5.397" />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth={strokeWidth} d="M14.965 6.658a3.001 3.001 0 0 0-5.76 0" />
      <path fill="currentColor" d="M13.084 7a1 1 0 1 1-2 0a1 1 0 0 1 2 0" />
    </g>
  </svg>
);

const SolarBottle = ({ className, size = 20 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <g>
      <path fill="currentColor" d="m18.45 8.279l.748-.06zm.015.187l.749-.047zM16.614 12.9l.495.563zm.137-.122l.505.554zm-6.68-3.82l.738.127zm.032-.185l.737.139zm2.884-3.786l.331.673zm-.162.081l.342.667zm-5.093 8.398l-.526-.535zm.128-.127l.532.529zm2.179-4.2l.737.135zm4.002 8.128l.732.165zm.041-.18l-.73-.174zm2.397-4.068l.502.557zM7.65 20.413l.387-.643zM5.462 18.81l-.621.42zm1.486-4.573l.525.535zm-1.77 2.08l-.7-.268zm3.138 4.496l-.387.642zm2.424 1.176l-.07.747zm3.053-3.628l-.731-.166zm-.84 2.638l.597.453zM18.34 2.9l.387-.643zm.41.308l.633-.404zm-.123.764l.656.363zm.202-.472l-.75-.034zm-2.383-.773l-.656-.363zm.313-.447l.413.626zm.8.15l-.387.642zm-.495-.232l.045-.749zM15.633 4.14l2.152 1.296l.774-1.285l-2.152-1.296zm-6.93 16.03l-.665-.4l-.774 1.285l.665.4zm4.607-3.07l-.248 1.095l1.463.332l.248-1.095zm-5.837-2.328l.785-.771l-1.052-1.07l-.784.772zm5.845-9.112l3.032-1.49l-.661-1.346l-3.032 1.49zm4.106-.807l.28 3.485l1.494-.12l-.279-3.484zm-.748-.993l.426-.77l-1.312-.727l-.427.771zm.496-.79l.78.471l.774-1.285l-.78-.47zm.798.538l-.455.822l1.313.727l.455-.823zm-.267 4.73l.014.176l1.497-.095l-.016-.2zm-.594 5.125c.068-.06.109-.095.147-.13l-1.01-1.11l-.128.114zm.608-4.95c.09 1.419-.46 2.789-1.471 3.71l1.01 1.11c1.358-1.238 2.076-3.055 1.958-4.914zm-6.908.572l.03-.173l-1.473-.278c-.01.052-.02.106-.035.197zm1.848-4.77c-.08.039-.129.062-.175.086l.685 1.334l.151-.075zM10.84 8.911c.262-1.391 1.128-2.561 2.327-3.177L12.482 4.4c-1.626.835-2.772 2.404-3.116 4.233zM8.258 14l.134-.133l-1.064-1.058l-.122.121zM9.33 8.83l-.03.174l1.475.27c.01-.05.018-.1.033-.19zm-.939 5.037a8.74 8.74 0 0 0 2.384-4.594L9.3 9.003a7.24 7.24 0 0 1-1.973 3.806zm6.38 3.564l.04-.171l-1.46-.348l-.042.188zm1.346-5.095l-.141.125l1.004 1.114l.128-.113zm-1.306 4.924a7.2 7.2 0 0 1 2.169-3.685l-1.004-1.114a8.7 8.7 0 0 0-2.624 4.451zm-6.774 2.51c-.631-.381-1.07-.646-1.395-.875c-.322-.226-.472-.377-.559-.506l-1.243.84c.236.35.558.625.939.893c.378.266.872.563 1.484.932zm-1.616-6.068c-.513.504-.927.91-1.234 1.258c-.31.35-.56.694-.71 1.088l1.401.534c.056-.148.17-.332.433-.629c.264-.3.633-.662 1.161-1.182zm-.338 4.688a1.99 1.99 0 0 1-.205-1.808l-1.402-.534a3.49 3.49 0 0 0 .364 3.18zm1.845 3.064c.612.37 1.105.667 1.516.876c.412.21.807.366 1.225.405l.14-1.493c-.14-.013-.335-.07-.685-.249s-.79-.443-1.422-.824zm5.133-3.26c-.167.737-.285 1.253-.401 1.644c-.117.389-.213.585-.306.707l1.195.906c.254-.335.413-.731.548-1.184c.134-.45.264-1.025.427-1.741zm-2.392 4.541a3.23 3.23 0 0 0 2.88-1.284l-1.196-.906a1.73 1.73 0 0 1-1.543.697zM17.952 3.54l.143.087q.055.035.075.05c.029.02-.012-.003-.052-.067l1.264-.808a1.3 1.3 0 0 0-.337-.344c-.096-.07-.214-.14-.32-.203zm1.33.793c.06-.108.126-.227.175-.335c.053-.116.111-.274.12-.466l-1.499-.068c.004-.076.027-.116.013-.084l-.041.08l-.08.147zm-1.165-.723a.25.25 0 0 1-.039-.146l1.499.068a1.25 1.25 0 0 0-.195-.73zm-1.016-.522l.088-.156c.024-.043.04-.068.05-.084c.022-.033 0 .011-.068.056l-.826-1.252c-.17.112-.28.253-.354.364c-.069.103-.138.23-.202.346zm.844-1.303c-.113-.068-.237-.144-.349-.199a1.3 1.3 0 0 0-.488-.139l-.09 1.498c-.08-.005-.122-.032-.087-.014q.024.01.085.047c.043.024.091.054.155.092zm-.774 1.119a.25.25 0 0 1-.153.04l.09-1.497a1.25 1.25 0 0 0-.763.205z" />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="m10 9.5l1.452-.726a2.7 2.7 0 0 1 2.9.307a2.7 2.7 0 0 0 2.544.454L18.5 9" />
    </g>
  </svg>
);

const SolarStarBold = ({ className, size = 18 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M9.153 5.408C10.42 3.136 11.053 2 12 2s1.58 1.136 2.847 3.408l.328.588c.36.646.54.969.82 1.182s.63.292 1.33.45l.636.144c2.46.557 3.689.835 3.982 1.776c.292.94-.546 1.921-2.223 3.882l-.434.507c-.476.557-.715.836-.822 1.18c-.107.345-.071.717.001 1.46l.066.677c.253 2.617.38 3.925-.386 4.506s-1.918.051-4.22-1.009l-.597-.274c-.654-.302-.981-.452-1.328-.452s-.674.15-1.328.452l-.596.274c-2.303 1.06-3.455 1.59-4.22 1.01c-.767-.582-.64-1.89-.387-4.507l.066-.676c.072-.744.108-1.116 0-1.46c-.106-.345-.345-.624-.821-1.18l-.434-.508c-1.677-1.96-2.515-2.941-2.223-3.882S3.58 8.328 6.04 7.772l.636-.144c.699-.158 1.048-.237 1.329-.45s.46-.536.82-1.182z" />
  </svg>
);

const SolarCheckCircleBold = ({ className, size = 12 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-5.97-3.03a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47l2.235-2.235L14.97 8.97a.75.75 0 0 1 1.06 0" clipRule="evenodd" />
  </svg>
);

const SolarCheckCircleLinear = ({ className, size = 20, strokeWidth = 1.5 }: { className?: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.5l2 2l5-5"/>
    </g>
  </svg>
);

const SolarArrowRightUpLinear = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6m0 0H9m9 0v9"/>
  </svg>
);

const cities = [
  { name: 'London', icon: 'circle-flags:gb' },
  { name: 'Paris', icon: 'circle-flags:fr' },
  { name: 'Milan', icon: 'circle-flags:it' },
  { name: 'Berlin', icon: 'circle-flags:de' }
];

// Helper to get current time slot
const getCurrentTimeSlot = () => {
  const now = new Date();
  let hour = now.getHours();
  let min = now.getMinutes();
  
  // Round to nearest 15 mins
  if (min < 15) min = 0;
  else if (min < 30) min = 15;
  else if (min < 45) min = 30;
  else {
    min = 45;
  }

  const start = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  let endHour = hour;
  let endMin = min + 15;
  if (endMin === 60) {
    endMin = 0;
    endHour++;
  }
  const end = `${(endHour % 24).toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  return `${start} - ${end}`;
};

export default function App() {
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeServiceCard, setActiveServiceCard] = useState<number | null>(null);

  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [isCityTransitioning, setIsCityTransitioning] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<number | null>(null);
  const [isChatTooltipVisible, setIsChatTooltipVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  // Fix Safari Mobile shift on refresh/reload by turning off browser scroll restoration and forcing top of page scroll
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    // Timeout to handle late-rendering offsets in Safari iOS
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to top of form when step changes (except on first load)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Only scroll to form if we are moving to a configuration/payment step (step > 1)
    // This solves the bug where it jumped to the form on initial site load
    if (bookingRef.current && step > 1) {
      const yOffset = -20; // Reduced offset for tighter scroll
      const y = bookingRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [step]);

  // Handle Stripe Redirection Status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const sessionId = params.get('session_id');

    if (status === 'success' && sessionId) {
      setLoading(true);
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setStep(5);
          } else {
            setStep(4);
            setBookingError(lang === 'fr' 
              ? "La vérification du paiement a échoué. Veuillez contacter le support si vous avez été débité." 
              : "Payment verification failed. Please contact support if you have been charged.");
          }
        })
        .catch(err => {
          console.error("Verification error:", err);
          setStep(4);
          setBookingError(lang === 'fr'
            ? "Une erreur est survenue lors de la vérification de votre paiement."
            : "An error occurred while verifying your payment.");
        })
        .finally(() => {
          setLoading(false);
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        });
    } else if (status === 'cancel') {
      setStep(4);
      setBookingError(lang === 'fr' 
        ? "Le paiement a été annulé. Vous pouvez réessayer." 
        : "Payment was cancelled. You can try again.");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [lang]);

  // Close lang menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setIsLangMenuOpen(false);
    if (isLangMenuOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isLangMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      // Show WhatsApp/Floating actions after scrolling past 400px (Hero area)
      const scrollPosition = window.scrollY;
      setIsChatTooltipVisible(scrollPosition > 400);

      const footer = document.getElementById('contact');
      if (footer) {
        const footerPosition = footer.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        // Show scroll top button if footer is within view
        setShowScrollTop(footerPosition < windowHeight + 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nextCity = useCallback(() => {
    if (isCityTransitioning) return;
    setIsCityTransitioning(true);
    setCurrentCityIndex((prev) => (prev + 1) % cities.length);
    setTimeout(() => setIsCityTransitioning(false), 1100); // Animation duration (exit + enter)
  }, [isCityTransitioning]);

  useEffect(() => {
    const timer = setInterval(nextCity, 1500);
    return () => clearInterval(timer);
  }, [nextCity]);

  const [openWhyIndex, setOpenWhyIndex] = useState<number | null>(0);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    serviceType: 'transfer' as 'transfer' | 'hourly',
    serviceCategory: 'transfer',
    durationHours: 2,
    pickup: '',
    dropoff: '',
    pickupCoords: null as [number, number] | null,
    dropoffCoords: null as [number, number] | null,
    date: '',
    time: '',
    vehicle: 'business',
    passengers: 1,
    luggage: 1,
    extras: [] as string[],
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+33',
    phone: '',
    flightNumber: '',
    paymentMethod: 'card',
    isReturnTrip: false,
    returnPickup: '',
    returnDropoff: '',
    returnPickupCoords: null as [number, number] | null,
    returnDropoffCoords: null as [number, number] | null,
    returnDate: '',
    returnTime: '',
    distance: 0,
    duration: 0
  });

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour <= 23; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const start = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        let endHour = hour;
        let endMin = min + 15;
        if (endMin === 60) {
          endMin = 0;
          endHour++;
        }
        const end = `${(endHour % 24).toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        slots.push(`${start} - ${end}`);
      }
    }
    return slots;
  }, []);

  const [suggestions, setSuggestions] = useState<{
    pickup: any[];
    dropoff: any[];
    returnPickup: any[];
    returnDropoff: any[];
  }>({ pickup: [], dropoff: [], returnPickup: [], returnDropoff: [] });

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pickupInputRef.current) {
      if (bookingData.pickup.trim() !== "" && !bookingData.pickupCoords) {
        pickupInputRef.current.setCustomValidity(lang === 'fr' ? "Veuillez sélectionner une adresse dans la liste." : "Please select an address from the list.");
      } else {
        pickupInputRef.current.setCustomValidity("");
      }
    }
  }, [bookingData.pickup, bookingData.pickupCoords, lang]);

  useEffect(() => {
    if (dropoffInputRef.current) {
      if (bookingData.dropoff.trim() !== "" && !bookingData.dropoffCoords) {
        dropoffInputRef.current.setCustomValidity(lang === 'fr' ? "Veuillez sélectionner une adresse dans la liste." : "Please select an address from the list.");
      } else {
        dropoffInputRef.current.setCustomValidity("");
      }
    }
  }, [bookingData.dropoff, bookingData.dropoffCoords, lang]);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ pickup: L.Marker | null; dropoff: L.Marker | null }>({ pickup: null, dropoff: null });
  const routeLineRef = useRef<L.Layer | null>(null);

  const revealRefs = useRef<(HTMLDivElement | HTMLElement)[]>([]);
  const servicesScrollRef = useRef<HTMLDivElement>(null);

  const scrollServices = (direction: 'next' | 'prev') => {
    if (!servicesScrollRef.current) return;
    const container = servicesScrollRef.current;
    const cards = Array.from(container.querySelectorAll('.snap-center')) as HTMLElement[];
    if (cards.length === 0) return;

    // Separate behavior for desktop (wide screens) and mobile/tablet
    const isDesktop = window.innerWidth >= 1024;

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;

    // Calculate exact target horizontal scroll offset for each card
    const cardPositions = cards.map((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardWidth = card.offsetWidth;
      const cardOffsetInContainer = cardRect.left - containerRect.left + scrollLeft;
      
      if (isDesktop) {
        // On desktop, align to the initial grid padding, keeping values unclamped so each card has a unique offset
        if (idx === 0) return 0;
        const initialPadding = cards[0].getBoundingClientRect().left - containerRect.left + scrollLeft;
        return cardOffsetInContainer - initialPadding;
      } else {
        // On mobile/tablet, center cards precisely
        let targetScroll = cardOffsetInContainer - (containerRect.width / 2) + (cardWidth / 2);
        targetScroll = Math.max(0, Math.min(container.scrollWidth - containerRect.width, targetScroll));
        return targetScroll;
      }
    });

    // Find the closest active index
    let activeIndex = 0;
    let minDistance = Infinity;
    cardPositions.forEach((pos, idx) => {
      const distance = Math.abs(scrollLeft - pos);
      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = idx;
      }
    });

    // Compute direct target index
    let targetIndex = activeIndex;
    if (direction === 'next') {
      targetIndex = Math.min(cards.length - 1, activeIndex + 1);
    } else {
      targetIndex = Math.max(0, activeIndex - 1);
    }

    let finalScrollLeft = cardPositions[targetIndex];

    if (isDesktop) {
      // Clamp the final target index scroll offset only at the end on desktop
      finalScrollLeft = Math.max(0, Math.min(container.scrollWidth - containerRect.width, finalScrollLeft));
    }

    container.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    revealRefs.current.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // --- Booking Form Logic ---

  const handleNextStep1 = async () => {
    const { pickupCoords, dropoffCoords, serviceType } = bookingData;
    
    setLoading(true);
    setBookingError(null);
    try {
      if (serviceType === 'transfer' && pickupCoords && dropoffCoords) {
        await calculateRoute(pickupCoords, dropoffCoords);
      } else if (serviceType === 'hourly' && pickupCoords) {
        // Just center map on pickup if hourly
        mapRef.current?.setView(pickupCoords, 14);
      } else {
        // Fallback values if coordinates are missing or not geocoded yet
        setBookingData(prev => ({
          ...prev,
          distance: prev.distance || 15,
          duration: prev.duration || 30,
          pickup: prev.pickup || 'Paris',
          dropoff: prev.serviceType === 'transfer' ? (prev.dropoff || 'Aéroport Charles de Gaulle (CDG)') : prev.dropoff
        }));
      }
      setStep(2);
    } catch (error) {
      console.error("Step 1 error:", error);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const vehicles = {
    business: { name: 'Business Class', model: 'Mercedes Classe E', basePrice: 80, hourlyPrice: 60, pax: 3, bag: 3, img: 'https://mcslimo.fr/wp-content/uploads/2023/04/eclass.png' },
    van: { name: 'Business Van', model: 'Mercedes Classe V', basePrice: 120, hourlyPrice: 90, pax: 7, bag: 7, img: 'https://mcslimo.fr/wp-content/uploads/2023/04/vclass.png' },
    first: { name: 'First Class', model: 'Mercedes Classe S', basePrice: 160, hourlyPrice: 120, pax: 3, bag: 3, img: 'https://mcslimo.fr/wp-content/uploads/2023/04/sclass.png' }
  };

  const extras = {
    child_seat: { name: 'Siège Bébé / Rehausseur', price: 15 },
    greeter: { name: 'Accueil Pancarte', price: 30 },
    extra_luggage: { name: 'Bagages Supplémentaires', price: 20 }
  };

  const translations = {
    fr: {
      title: 'Réserver votre trajet',
      step1: 'Trajet',
      step2: 'Itinéraire',
      step3: 'Véhicule',
      step4: 'Contact',
      pickup: 'Lieu de départ',
      dropoff: 'Lieu d\'arrivée',
      date: 'Date de départ',
      time: 'Heure',
      field_time: 'Heure de départ',
      service_transfer: 'Transfert',
      service_hourly: 'Mise à Disposition',
      field_service_category: 'Type de prestation',
      placeholder_service_category: 'Sélectionner un service...',
      service_cat_intercity: 'Liaisons Intervilles',
      service_cat_airport: 'Gares & Aéroports',
      service_cat_vip: 'Accueil & Service VIP',
      service_cat_hourly: 'Mise à Disposition',
      service_cat_prestige: 'Prestige & Événementiel',
      duration_label: 'Durée souhaitée',
      hours_count: 'heures',
      view_prices: 'Voir les tarifs',
      next: 'Suivant',
      back: 'Retour',
      confirm: 'Confirmer la réservation',
      summary: 'Récapitulatif',
      total: 'Total estimé',
      passengers: 'Passagers',
      passenger_singular: 'Passager',
      passenger_plural: 'Passagers',
      luggage: 'Bagages',
      luggage_label: 'Bagages',
      extras_label: 'Options Supplémentaires',
      payment: 'Mode de paiement',
      payment_mode: 'Mode de paiement',
      card: 'Paiement en ligne (Stripe)',
      cash: 'Espèces (à bord)',
      transfer: 'Virement (avance)',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      flight: 'N° de vol / train (optionnel)',
      returnTrip: 'Trajet Retour',
      add_return: 'Ajouter un trajet retour',
      itinerary_return: 'Itinéraire Retour',
      returnDate: 'Date de retour',
      field_returnDate: 'Date de retour',
      field_returnTime: 'Heure de retour',
      returnTime: 'Heure Retour',
      vehicle_business: 'Business Class',
      vehicle_van: 'Business Van',
      vehicle_first: 'First Class',
      extra_child_seat: 'Siège Bébé / Rehausseur',
      extra_greeter: 'Accueil Pancarte',
      extra_extra_luggage: 'Bagages Supplémentaires',
      success: 'Demande envoyée !',
      successMsg: 'Votre demande de réservation a été transmise. Un conseiller vous contactera par SMS ou Email pour confirmer la disponibilité.',
      newReservation: 'Nouvelle réservation',
      orderSummary: 'Récapitulatif de commande',
      departure: 'Départ',
      arrival: 'Arrivée',
      dateTime: 'Date & Heure',
      vatIncluded: 'TVA incluse',
      itinerary_label: 'Votre Itinéraire',
      pickup_label: 'Lieu de prise en charge',
      pickup_placeholder: 'Adresse, Aéroport, Gare...',
      dropoff_label: 'Destination',
      dropoff_placeholder: 'Destination',
      placeholder_firstName: 'Votre prénom',
      placeholder_lastName: 'Votre nom',
      placeholder_email: 'jean@entreprise.com',
      placeholder_phone: 'Votre téléphone',
      swap_addresses: 'Inverser les adresses',
      nav_services: 'Services',
      nav_fleet: 'La Flotte',
      nav_gallery: 'Galerie',
      nav_business: 'Business',
      nav_contact: 'Contact',
      nav_booking: 'Réservation',
      hero_badge: 'Transport Exécutif, Flotte d\'Élite & Itinéraires Sur Mesure',
      hero_brand: 'SAFENESS',
      hero_worldwide: 'Worldwide',
      hero_book: 'RÉSERVER UN VÉHICULE',
      hero_estimate: 'DEMANDER UN DEVIS PERSONNALISÉ',
      europe_tag: 'Europe',
      europe_title: 'Une présence',
      europe_subtitle: 'Européenne',
      europe_desc: 'Bien que notre centre d\'opérations soit situé à Paris, nous assurons vos liaisons longue distance vers les principales métropoles européennes.',
      europe_hub_tag: 'Hub Principal',
      europe_hub_title: 'Paris Centre',
      europe_hub_desc: 'Le cœur de notre réseau. Chauffeurs d\'élite disponibles 24/7 pour vos besoins locaux et transferts internationaux.',
      europe_munich_tag: 'Pôle d\'affaires Bavarois',
      europe_milan_tag: 'Haut-lieu du design Italien',
      europe_berlin_tag: 'Centre technologique Européen',
      europe_connect_title: 'Europe Connect',
      europe_connect_desc: 'Liaisons quotidiennes vers Amsterdam, Bruxelles, et les métropoles régionales françaises.',
      services_tag: 'Prestations',
      services_title: 'Nos Services',
      services_desc: 'Solutions de transport haut de gamme conçues pour répondre parfaitement à vos besoins professionnels et personnels les plus complexes.',
      service1_title: 'Liaisons Intervilles',
      service1_desc: 'Liaisons nationales et trajets ville à ville avec un confort absolu.',
      service2_title: 'Gares & Aéroports',
      service2_desc: 'Liaisons aéroports et gares avec une ponctualité garantie.',
      service3_title: 'Accueil & Service VIP',
      service3_desc: 'Accueil personnalisé et accompagnement pour une transition fluide.',
      service4_title: 'Mise à Disposition',
      service4_desc: 'Un chauffeur dédié à votre entière disposition pour vos besoins.',
      service5_title: 'Prestige & Événementiel',
      service5_desc: 'Service de prestige pour vos mariages, galas et événements spéciaux.',
      service1_feat1: 'Liaisons nationales',
      service1_feat2: 'Confort longue distance',
      service1_feat3: 'Trajets ville à ville',
      service2_feat1: 'Aéroports & Gares',
      service2_feat2: 'Ponctualité garantie',
      service2_feat3: 'Wi-Fi & Rafraîchissements',
      service3_feat1: 'Accueil pancarte',
      service3_feat2: 'Gestion des bagages',
      service3_feat3: 'Sortie prioritaire',
      service4_feat1: 'Chauffeur dédié',
      service4_feat2: 'Flexibilité totale',
      service4_feat3: 'Discrétion absolue',
      service5_feat1: 'Mariages & Galas',
      service5_feat2: 'Logistique complète',
      service5_feat3: 'Véhicules décorés',
      service_more: 'Voir plus de services',
      service_book: 'Réserver ce service',
      section_book_btn: 'Réserver un service',
      engagement_tag: 'Engagement',
      engagement_title: 'L\'Excellence Absolue',
      val1_title: 'Chauffeurs Experts',
      val1_desc: 'Plus de 10 ans d\'expérience. Discrets, multilingues et formés à l\'excellence.',
      val2_title: 'Haut de Gamme',
      val2_desc: 'Véhicules récents et luxueux, entretenus méticuleusement pour votre confort.',
      val3_title: 'Service 24/7',
      val3_desc: 'Une conciergerie disponible en permanence pour assurer vos déplacements à toute heure.',
      val4_title: 'Ponctualité',
      val4_desc: 'Votre temps est précieux. Nos chauffeurs arrivent 15 minutes avant chaque prestation.',
      corp_tag: 'Corporate',
      corp_title: 'Solutions Business',
      corp_subtitle: 'Solutions pour entreprises',
      corp_desc: 'Safeness Transport propose des comptes corporate sur-mesure pour les entreprises, les hôtels de luxe et les agences événementielles. Optimisez la gestion des déplacements de vos collaborateurs et de vos clients VIP avec un partenaire fiable.',
      corp_li1: 'Facturation simplifiée et relevés mensuels détaillés.',
      corp_li2: 'Priorité sur les réservations et support client dédié 24/7.',
      corp_li3: 'Coordination complète pour vos roadshows et grands événements.',
      corp_cta: 'Contact pour transferts entreprises',
      contact_pro: 'Contact Pro',
      vip_tag: 'En approche',
      vip_guest: 'Client VIP',
      vip_flight: 'Vol AF1234',
      vip_pickup_label: 'Pick-up',
      vip_pickup_val: 'Aéroport CDG, Terminal 2E',
      vip_dropoff_label: 'Drop-off',
      vip_dropoff_val: 'Siège Social, Paris 8',
      vip_vehicle_label: 'Véhicule',
      vip_vehicle_val: 'Mercedes Classe S',
      field_name: 'Nom Complet',
      field_date: 'Date de départ',
      field_company: 'Société (facultatif)',
      phone_contact: 'Téléphone',
      field_message: 'Message',
      placeholder_name: 'Jean Dupont',
      placeholder_company: 'Entreprise S.A.',
      placeholder_message: 'Décrivez votre besoin...',
      contact_btn: 'Envoyer ma demande',
      fleet_tag: 'Fleet',
      fleet_title: 'Notre Flotte',
      fleet_wifi: 'Wi-Fi Inclus',
      fleet_drinks: 'Boissons',
      vision_tag: 'Vision',
      vision_title: 'L\'Expérience Safeness',
      vision_desc: 'Découvrez l\'excellence de nos services à travers notre sélection de moments privilégiés et de véhicules d\'exception.',
      gallery_img1_alt: 'Intérieur Luxe',
      gallery_img2_alt: 'Vue Classe V Mercedes',
      gallery_img3_alt: 'Détail Cabine Premium',
      reviews_tag: 'Témoignages',
      reviews_title: 'Avis Clients',
      transfers_tag: 'Tarifs',
      transfers_title: 'Transferts Populaires',
      transfers_desc: 'Nos itinéraires les plus demandés avec des tarifs fixes et transparents.',
      route_cdg: 'Aéroport CDG ↔ Paris',
      route_orly: 'Aéroport Orly ↔ Paris',
      route_beauvais: 'Aéroport Beauvais ↔ Paris',
      route_disney: 'Disneyland Paris ↔ Paris',
      route_versailles: 'Chateau de Versailles ↔ Paris',
      route_giverny: 'Giverny (Jardins de Monet) ↔ Paris',
      from_price: 'Dès',
      excellent: 'Excellent',
      verified_count: '48 avis vérifiés',
      verified_label: 'Vérifié',
      faq_tag: 'FAQ',
      faq_title: 'Questions Fréquentes',
      q1: 'Jusqu\'où pouvez-vous effectuer des transferts ?',
      a1: 'Bien que notre base soit à Paris, nous couvrons l\'ensemble de la France et effectuons régulièrement des transferts vers les grandes villes européennes (Munich, Milan, Berlin, Amsterdam, Genève, etc.). Demandez-nous un devis pour votre trajet longue distance.',
      q2: 'Comment se passe l\'accueil à l\'aéroport ou à la gare ?',
      a2: 'Votre chauffeur vous attendra à la sortie de la zone douanière (aéroports) ou en bout de quai (gares) avec une tablette nominative. Il vous aidera avec vos bagages et vous conduira directement au véhicule.',
      q3: 'Les tarifs sont-ils fixes ?',
      a3: 'Oui, lors de votre réservation, nous vous communiquons un tarif fixe et définitif. Il n\'y a aucun frais caché lié au trafic ou au temps de trajet (hors temps d\'attente exceptionnel non prévu).',
      q4: 'Que se passe-t-il si mon vol ou mon train est en retard ?',
      a4: 'Nous suivons en temps réel l\'état de votre vol ou de votre train grâce au numéro communiqué lors de la réservation. Le chauffeur ajustera son heure d\'arrivée en conséquence, sans frais supplémentaires.',
      q5: 'Quels sont les modes de paiement acceptés ?',
      a5: 'Nous acceptons les paiements par carte bancaire (Visa, Mastercard, Amex) directement à bord du véhicule, les espèces, ainsi que les virements bancaires pour les réservations effectuées à l\'avance.',
      q6: 'Puis-je modifier ou annuler ma réservation ?',
      a6: 'Oui, vous pouvez modifier ou annuler votre réservation. Nous vous recommandons de nous contacter au moins 24 heures à l\'avance. Les conditions spécifiques d\'annulation vous seront précisées lors de la confirmation.',
      footer_desc: "L'élite du transport : prestige mondial, excellence sans compromis",
      legal: 'Mentions légales',
      privacy: 'Mentions légales',
      whatsapp_tooltip: 'Réserver sur WhatsApp',
      lang_fr: 'Français',
      lang_en: 'Anglais',
      rev1_text: '"Service impeccable pour mon transfert vers Orly. Le chauffeur était en avance, le véhicule (Classe S) d\'une propreté absolue. Conduite très douce. Je recommande vivement Safeness transport."',
      rev2_text: '"Nous avons réservé un Van pour nous rendre à Disneyland depuis Paris intra-muros avec les enfants. Voyage spacieux, bouteilles d\'eau à disposition, service très courtois."',
      rev3_text: '"Utilisé pour un déplacement professionnel de Paris vers Milan. Un trajet longue distance qui s\'est déroulé dans un confort parfait. Mon bureau mobile le temps d\'une journée."',
      rev4_text: '"Une expérience de luxe du début à la fin. L\'accueil VIP à l\'aéroport CDG a rendu mon arrivée à Paris totalement sans stress. Je ne voyagerai plus autrement."',
      rev5_text: '"Chauffeur extrêmement professionnel et discret. La Classe E était parfaite pour mes rendez-vous d\'affaires toute la journée. Un service 5 étoiles."',
      rev6_text: '"Ponctualité et discrétion. Le service de conciergerie à bord est un vrai plus. Je recommande Safeness transport pour tous vos déplacements d\'affaires à Paris."',
      why_tag: 'About Us',
      why_title: 'Pourquoi nous choisir',
      why_item1_title: '10+ ans d\'Expertise',
      why_item1_desc: 'Fort de plus d\'une décennie d\'excellence dans le transport de luxe international, Safeness transport a perfectionné l\'art du voyage sur mesure. Nous maîtrisons chaque aspect logistique et chaque itinéraire européen pour vous garantir une ponctualité absolue, une sécurité rigoureuse et une sérénité totale lors de tous vos déplacements.',
      why_item2_title: 'Réseau International',
      why_item2_desc: 'Notre réseau s\'étend sur les pôles économiques les plus dynamiques d\'Europe, incluant Paris, Milan, Berlin et Londres. Cette présence stratégique nous permet d\'assurer des transferts transfrontaliers fluides et une continuité de service irréprochable. Vous bénéficiez ainsi d\'une expertise locale combinée à un standard de qualité international constant partout.',
      why_item3_title: 'Conciergerie Dédiée',
      why_item3_desc: 'Bien plus qu\'un simple service de chauffeur, notre conciergerie dédiée s\'occupe de chaque détail de votre voyage. De l\'accueil personnalisé aux terminaux privés jusqu\'à la réservation de restaurants exclusifs ou la gestion de bagages fragiles, nous anticipons vos besoins pour transformer chaque trajet en une expérience de luxe unique.',
      why_item4_title: 'Solutions Entreprises',
      why_item4_desc: 'Nous offrons aux entreprises des solutions de mobilité intelligentes et personnalisées. Profitez d\'une plateforme de gestion centralisée, d\'une facturation transparente et d\'un support prioritaire disponible 24/7. Nos services sont conçus pour s\'adapter aux exigences élevées du monde des affaires, permettant à vos collaborateurs de rester productifs en déplacement.',
      why_stat1_val: '10+',
      why_stat1_label: 'Années d\'expertise',
      why_stat2_val: '98%',
      why_stat2_label: 'Satisfaction client',
      why_stat3_val: '24/7',
      why_stat3_label: 'Disponibilité',
    },
    en: {
      title: 'Premium Booking',
      step1: 'Route',
      step2: 'Itinerary',
      step3: 'Vehicle',
      step4: 'Contact',
      pickup: 'Pickup Location',
      dropoff: 'Drop-off Location',
      date: 'Pick-up date',
      time: 'Time',
      field_time: 'Pick-up Time',
      service_transfer: 'Transfer',
      service_hourly: 'Chauffeur at disposal',
      field_service_category: 'Type of Service',
      placeholder_service_category: 'Select a service...',
      service_cat_intercity: 'Intercity Rides',
      service_cat_airport: 'Airport Transfers',
      service_cat_vip: 'Travel Transfer / VIP Welcome',
      service_cat_hourly: 'Chauffeur at disposal',
      service_cat_prestige: 'Wedding & Event Class',
      duration_label: 'Desired duration',
      hours_count: 'hours',
      view_prices: 'View Prices',
      next: 'Next',
      back: 'Back',
      confirm: 'Confirm Booking',
      summary: 'Summary',
      total: 'Estimated Total',
      passengers: 'Passengers',
      passenger_singular: 'Passenger',
      passenger_plural: 'Passengers',
      luggage: 'Luggage',
      luggage_label: 'Luggage',
      extras_label: 'Additional Options',
      payment: 'Payment Method',
      payment_mode: 'Payment Method',
      card: 'Online Payment (Stripe)',
      cash: 'Cash (on board)',
      transfer: 'Bank Transfer (advance)',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      flight: 'Flight / Train No. (optional)',
      returnTrip: 'Return Trip',
      add_return: 'Add return trip',
      itinerary_return: 'Return Itinerary',
      returnDate: 'Return trip date',
      field_returnDate: 'Return trip date',
      field_returnTime: 'Return time',
      returnTime: 'Return Time',
      vehicle_business: 'Business Class',
      vehicle_van: 'Business Van',
      vehicle_first: 'First Class',
      extra_child_seat: 'Child Seat / Booster',
      extra_greeter: 'Meet & Greet (Sign)',
      extra_extra_luggage: 'Extra Luggage',
      success: 'Request Sent!',
      successMsg: 'Your booking request has been transmitted. A consultant will contact you via SMS or Email to confirm availability.',
      newReservation: 'New booking',
      orderSummary: 'Order Summary',
      departure: 'Departure',
      arrival: 'Arrival',
      dateTime: 'Date & Time',
      vatIncluded: 'VAT included',
      itinerary_label: 'Your Itinerary',
      pickup_label: 'Pickup location',
      pickup_placeholder: 'Address, airport, station...',
      dropoff_label: 'Destination',
      dropoff_placeholder: 'Destination',
      placeholder_firstName: 'Your first name',
      placeholder_lastName: 'Your last name',
      placeholder_email: 'john@example.com',
      placeholder_phone: 'Your phone number',
      swap_addresses: 'Swap addresses',
      nav_services: 'Services',
      nav_fleet: 'Fleet',
      nav_gallery: 'Gallery',
      nav_business: 'Business',
      nav_contact: 'Contact',
      nav_booking: 'Booking',
      hero_badge: 'Executive Transport, Elite Fleet & Bespoke Itineraries',
      hero_brand: 'SAFENESS',
      hero_worldwide: 'Worldwide',
      hero_book: 'BOOK A VEHICLE',
      hero_estimate: 'REQUEST CUSTOM ESTIMATE',
      europe_tag: 'Europe',
      europe_title: 'European',
      europe_subtitle: 'Presence',
      europe_desc: 'While our operations center is in Paris, we provide long-distance connections to major European metropolises.',
      europe_hub_tag: 'Main Hub',
      europe_hub_title: 'Central Paris',
      europe_hub_desc: 'The heart of our network. Elite chauffeurs available 24/7 for local needs and international transfers.',
      europe_munich_tag: 'Bavarian Business Hub',
      europe_milan_tag: 'Italian Design Hub',
      europe_berlin_tag: 'European Tech Hub',
      europe_connect_title: 'Europe Connect',
      europe_connect_desc: 'Daily links to Amsterdam, Brussels, and major French regional cities.',
      services_tag: 'Expertise',
      services_title: 'Our Services',
      services_desc: 'Premium tailored transportation solutions specifically designed to meet all of your most demanding professional and personal travel requirements efficiently.',
      service1_title: 'Intercity Rides',
      service1_desc: 'National links and city-to-city trips with absolute comfort.',
      service2_title: 'Airport Transfers',
      service2_desc: 'Airport and station links with guaranteed punctuality.',
      service3_title: 'Travel Transfer',
      service3_desc: 'Personalized welcome and support for a seamless transition.',
      service4_title: 'Chauffeur Hailing',
      service4_desc: 'A dedicated chauffeur at your full disposal for your needs.',
      service5_title: 'Wedding Class',
      service5_desc: 'Prestige service for your weddings, galas and special events.',
      service1_feat1: 'National links',
      service1_feat2: 'Long distance comfort',
      service1_feat3: 'City-to-city trips',
      service2_feat1: 'Airports & Stations',
      service2_feat2: 'Guaranteed punctuality',
      service2_feat3: 'Wi-Fi & Refreshments',
      service3_feat1: 'Meet & Greet',
      service3_feat2: 'Luggage management',
      service3_feat3: 'Priority exit',
      service4_feat1: 'Dedicated chauffeur',
      service4_feat2: 'Full flexibility',
      service4_feat3: 'Absolute discretion',
      service5_feat1: 'Weddings & Galas',
      service5_feat2: 'Full logistics',
      service5_feat3: 'Decorated vehicles',
      service_more: 'View more services',
      service_book: 'Book this service',
      section_book_btn: 'Book a service',
      engagement_tag: 'Engagement',
      engagement_title: 'Absolute Excellence',
      val1_title: 'Expert Chauffeurs',
      val1_desc: 'Over 10 years of experience. Discreet, multilingual and trained for excellence.',
      val2_title: 'High-End',
      val2_desc: 'Recent and luxurious vehicles, meticulously maintained for your comfort.',
      val3_title: '24/7 Service',
      val3_desc: 'A permanent concierge available at all times to ensure your travels.',
      val4_title: 'Punctuality',
      val4_desc: 'Your time is precious. Our drivers arrive 15 minutes before each service.',
      corp_tag: 'Corporate',
      corp_title: 'Business Solutions',
      corp_subtitle: 'Solutions for business',
      corp_desc: 'Safeness Transport offers bespoke corporate accounts for companies, luxury hotels and event agencies. Optimize the management of your employees and VIP clients travels with a reliable partner.',
      corp_li1: 'Simplified billing and detailed monthly statements.',
      corp_li2: 'Priority on bookings and dedicated 24/7 client support.',
      corp_li3: 'Complete coordination for your roadshows and major events.',
      corp_cta: 'Contact us for corporate transfers',
      contact_pro: 'Contact Pro',
      vip_tag: 'Inbound',
      vip_guest: 'VIP Guest',
      vip_flight: 'Flight AF1234',
      vip_pickup_label: 'Pick-up',
      vip_pickup_val: 'CDG Airport, Terminal 2E',
      vip_dropoff_label: 'Drop-off',
      vip_dropoff_val: 'Headquarters, Paris 8',
      vip_vehicle_label: 'Vehicle',
      vip_vehicle_val: 'Mercedes S-Class',
      field_name: 'Full Name',
      field_date: 'Pick-up date',
      field_company: 'Company (optional)',
      phone_contact: 'Phone Number',
      field_message: 'Message',
      placeholder_name: 'John Doe',
      placeholder_company: 'Company Inc.',
      placeholder_message: 'Describe your need...',
      contact_btn: 'Send Request',
      fleet_tag: 'Fleet',
      fleet_title: 'Our Fleet',
      fleet_wifi: 'In-car Wi-Fi',
      fleet_drinks: 'Beverages',
      vision_tag: 'Vision',
      vision_title: 'The Safeness Experience',
      vision_desc: 'Discover the excellence of our services through our selection of privileged moments and exceptional vehicles.',
      gallery_img1_alt: 'Luxury Interior',
      gallery_img2_alt: 'Mercedes V-Class View',
      gallery_img3_alt: 'Premium Cabin Detail',
      reviews_tag: 'Testimonials',
      reviews_title: 'Client Reviews',
      transfers_tag: 'Rates',
      transfers_title: 'Popular Transfers',
      transfers_desc: 'Our most requested routes with fixed and transparent pricing.',
      route_cdg: 'CDG Airport ↔ Paris',
      route_orly: 'Orly Airport ↔ Paris',
      route_beauvais: 'Beauvais Airport ↔ Paris',
      route_disney: 'Disneyland Paris ↔ Paris',
      route_versailles: 'Palace of Versailles ↔ Paris',
      route_giverny: 'Giverny (Monet\'s Garden) ↔ Paris',
      from_price: 'From',
      excellent: 'Excellent',
      verified_count: '48 verified reviews',
      verified_label: 'Verified',
      faq_tag: 'FAQ',
      faq_title: 'Frequently Asked Questions',
      q1: 'How far can you carry out transfers?',
      a1: 'Although our base is in Paris, we cover all of France and regularly carry out transfers to major European cities (Munich, Milan, Berlin, Amsterdam, Geneva, etc.). Ask us for a quote for your long-distance trip.',
      q2: 'How does the welcome at the airport or station work?',
      a2: 'Your driver will be waiting for you at the customs exit (airports) or at the end of the platform (stations) with a nameplate. They will help you with your luggage and take you directly to the vehicle.',
      q3: 'Are the rates fixed?',
      a3: 'Yes, when you book, we communicate a fixed and final rate. There are no hidden fees related to traffic or travel time (except for exceptional, unplanned waiting time).',
      q4: 'What happens if my flight or train is late?',
      a4: 'We monitor the status of your flight or train in real time using the number provided during booking. The driver will adjust their arrival time accordingly, at no extra cost.',
      q5: 'What payment methods do you accept?',
      a5: 'We accept credit card payments (Visa, Mastercard, Amex) directly on board, cash, as well as bank transfers for bookings made in advance.',
      q6: 'Can I modify or cancel my booking?',
      a6: 'Yes, you can modify or cancel your booking. We recommend contacting us at least 24 hours in advance. Specific cancellation conditions will be provided upon confirmation.',
      footer_desc: 'Elite transport: global prestige, uncompromising excellence',
      legal: 'Legal notice',
      privacy: 'Privacy Policy',
      whatsapp_tooltip: 'Book on WhatsApp',
      lang_fr: 'French',
      lang_en: 'English',
      rev1_text: '"Impeccable service for my transfer to Orly. The driver was early, the vehicle (S-Class) was absolutely clean. Very smooth driving. I highly recommend Safeness transport."',
      rev2_text: '"We booked a Van to go to Disneyland from central Paris with the children. Spacious journey, water bottles available, very courteous service."',
      rev3_text: '"Used for a business trip from Paris to Milan. A long-distance journey that took place in perfect comfort. My mobile office for a day."',
      rev4_text: '"A luxury experience from start to finish. The VIP welcome at CDG airport made my arrival in Paris totally stress-free. I won\'t travel any other way."',
      rev5_text: '"Extremely professional and discreet driver. The E-Class was perfect for my business meetings all day. A 5-star service."',
      rev6_text: '"Punctuality and discretion. The on-board concierge service is a real plus. I recommend Safeness transport for all your business travels in Paris."',
      why_tag: 'About Us',
      why_title: 'Why Choose Us',
      why_item1_title: '10+ Years of Expertise',
      why_item1_desc: 'With over a decade of excellence in international luxury transport, Safeness transport has perfected the art of tailor-made travel. We master every logistical aspect and every European route to guarantee you absolute punctuality, rigorous security, and total serenity during all your journeys, regardless of their complexity.',
      why_item2_title: 'Global Network',
      why_item2_desc: 'Our network spans Europe\'s most dynamic economic hubs, including Paris, Milan, Berlin, and London. This strategic presence allows us to ensure smooth cross-border transfers and irreproachable service continuity. You thus benefit from local expertise combined with a constant international quality standard, ensuring a premium experience wherever you go.',
      why_item3_title: 'Bespoke Concierge',
      why_item3_desc: 'Much more than a simple chauffeur service, our dedicated concierge takes care of every single detail of your journey. From personalized welcomes at private terminals to booking exclusive restaurants or managing fragile luggage, we anticipate your needs to transform every trip into a seamless and refined luxury travel experience.',
      why_item4_title: 'Business Solutions',
      why_item4_desc: 'We offer companies intelligent and personalized mobility solutions. Benefit from a centralized management platform, transparent invoicing, and 24/7 priority support. Our services are specifically designed to adapt to the high demands of the business world, allowing your employees and executives to remain fully productive while traveling in comfort.',
      why_stat1_val: '10+',
      why_stat1_label: 'Years of expertise',
      why_stat2_val: '98%',
      why_stat2_label: 'Customer satisfaction',
      why_stat3_val: '24/7',
      why_stat3_label: 'Availability',
    }
  };

  const t = (key: string) => (translations as any)[lang][key] || key;

  // Reviews Carousel State
  const reviews = useMemo(() => [
    { name: 'Marc J.', initial: 'MJ', text: t('rev1_text') },
    { name: 'Sophie L.', initial: 'SL', text: t('rev2_text') },
    { name: 'Antoine D.', initial: 'AD', text: t('rev3_text') },
    { name: 'Elena R.', initial: 'ER', text: t('rev4_text') },
    { name: 'Thomas B.', initial: 'TB', text: t('rev5_text') },
    { name: 'Julie M.', initial: 'JM', text: t('rev6_text') }
  ], [t]);

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isReviewsPaused, setIsReviewsPaused] = useState(false);
  const [isReviewsVisible, setIsReviewsVisible] = useState(false);
  const reviewsRef = useRef<HTMLElement>(null);

  const getItemsPerPage = useCallback(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }, []);

  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    setItemsPerPage(getItemsPerPage());
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getItemsPerPage]);

  const nextReview = useCallback(() => {
    setCurrentReviewIndex((prev) => {
      const max = Math.max(0, reviews.length - itemsPerPage);
      return prev >= max ? 0 : prev + 1;
    });
  }, [reviews.length, itemsPerPage]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsReviewsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsReviewsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextReview();
    } else if (isRightSwipe) {
      setCurrentReviewIndex((prev) => (prev === 0 ? Math.max(0, reviews.length - itemsPerPage) : prev - 1));
    }
  };

  useEffect(() => {
    const el = reviewsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsReviewsVisible(entry.isIntersecting);
    }, { threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isReviewsPaused || !isReviewsVisible) return;
    const timer = setInterval(nextReview, 2500);
    return () => clearInterval(timer);
  }, [nextReview, isReviewsPaused, isReviewsVisible]);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([48.8566, 2.3522], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);
      
      mapRef.current = map;
    }
    
    // Ensure route is drawn if container is now available and map is ready
    if (mapRef.current && bookingData.pickupCoords && bookingData.dropoffCoords && !routeLineRef.current) {
      calculateRoute(bookingData.pickupCoords, bookingData.dropoffCoords);
    }
  }, [step, bookingData.pickupCoords, bookingData.dropoffCoords]);

  // Invalidate map size when step changes (for layout transitions)
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
        
        // Ensure the route is visible if it exists
        if (routeLineRef.current && (step >= 2 && step <= 4)) {
          if ('getBounds' in routeLineRef.current) {
            mapRef.current?.fitBounds((routeLineRef.current as any).getBounds(), { padding: [50, 50] });
          }
        }
      }, 600);
    }
  }, [step]);

  const searchAddress = async (query: string, type: 'pickup' | 'dropoff' | 'returnPickup' | 'returnDropoff') => {
    if (query.length < 3) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=fr,be,ch,lu,it,es,de,nl,gb`
      );
      if (!response.ok) {
        throw new Error('Nominatim request failed');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        const results = data.map((item: any) => ({
          description: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));
        setSuggestions(prev => ({ ...prev, [type]: results }));
      } else {
        setSuggestions(prev => ({ ...prev, [type]: [] }));
      }
    } catch (e) {
      console.error('Nominatim Search Error:', e);
      setSuggestions(prev => ({ ...prev, [type]: [] }));
    }
  };

  const selectAddress = (item: any, type: 'pickup' | 'dropoff' | 'returnPickup' | 'returnDropoff') => {
    const lat = typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat;
    const lon = typeof item.lon === 'string' ? parseFloat(item.lon) : item.lon;
    const coords: [number, number] = [lat, lon];
    
    setBookingData(prev => ({
      ...prev,
      [type]: item.description,
      [`${type}Coords`]: coords
    }));
    setSuggestions(prev => ({ ...prev, [type]: [] }));

    if (mapRef.current && (type === 'pickup' || type === 'dropoff')) {
      if (markersRef.current[type]) {
        markersRef.current[type]?.remove();
      }
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 ${type === 'pickup' ? 'bg-stone-900' : 'bg-stone-600'} rounded-full border-2 border-white flex items-center justify-center shadow-lg"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      markersRef.current[type] = L.marker(coords, { icon }).addTo(mapRef.current);
      
      const otherType = type === 'pickup' ? 'dropoff' : 'pickup';
      if (bookingData[`${otherType}Coords`]) {
        calculateRoute(coords, bookingData[`${otherType}Coords`] as [number, number]);
      } else {
        mapRef.current.setView(coords, 14);
      }
    }
  };

  const calculateRoute = async (p1: [number, number], p2: [number, number]) => {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // km
        const duration = route.duration / 60; // min

        setBookingData(prev => ({ ...prev, distance, duration }));

        if (routeLineRef.current) routeLineRef.current.remove();
        
        if (mapRef.current) {
          routeLineRef.current = L.geoJSON(route.geometry, {
            style: { color: '#1c1917', weight: 4, opacity: 0.8 }
          }).addTo(mapRef.current);

          if (routeLineRef.current && 'getBounds' in routeLineRef.current) {
            mapRef.current.fitBounds((routeLineRef.current as any).getBounds(), { padding: [50, 50] });
          }
        }
      }
    } catch (error) {
      console.error('Route error:', error);
      // Fallback values to not block the user
      setBookingData(prev => ({ ...prev, distance: 15, duration: 30 }));
    }
  };

  const totalPrice = useMemo(() => {
    const vehicle = (vehicles as any)[bookingData.vehicle];
    let price = 0;
    
    if (bookingData.serviceType === 'hourly') {
      price = vehicle.hourlyPrice * bookingData.durationHours;
    } else {
      price = vehicle.basePrice;
      // Distance pricing (simplified: base + 2€/km after 10km)
      if (bookingData.distance > 10) {
        price += (bookingData.distance - 10) * 2;
      }
      
      // Return trip multiplier (only for transfer)
      if (bookingData.isReturnTrip) price *= 2;
    }

    // Extras
    bookingData.extras.forEach(extraKey => {
      price += (extras as any)[extraKey].price;
    });

    // Night/Weekend surcharge (mock logic)
    const hour = parseInt(bookingData.time.split(':')[0]);
    if (hour >= 21 || hour <= 6) price *= 1.2;

    return Math.round(price);
  }, [bookingData.vehicle, bookingData.distance, bookingData.durationHours, bookingData.serviceType, bookingData.extras, bookingData.time, bookingData.isReturnTrip]);

  const handleBooking = async () => {
    // Check contact form validity
    if (!firstNameRef.current?.reportValidity()) return;
    if (!lastNameRef.current?.reportValidity()) return;
    if (!emailRef.current?.reportValidity()) return;
    if (!phoneRef.current?.reportValidity()) return;

    setLoading(true);
    setBookingError(null);
    
    // If credit card, redirect to Stripe
    if (bookingData.paymentMethod === 'card') {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceType: bookingData.serviceType,
            serviceCategory: bookingData.serviceCategory,
            durationHours: bookingData.durationHours,
            vehicle: bookingData.vehicle,
            distance: bookingData.distance,
            extras: bookingData.extras,
            time: bookingData.time,
            isReturnTrip: bookingData.isReturnTrip,
            pickup: bookingData.pickup,
            dropoff: bookingData.serviceType === 'transfer' ? bookingData.dropoff : 'Mise à disposition',
            firstName: bookingData.firstName,
            lastName: bookingData.lastName,
            email: bookingData.email,
            phone: `${bookingData.countryCode} ${bookingData.phone}`,
            passengers: bookingData.passengers,
            luggage: bookingData.luggage,
            flightNumber: bookingData.flightNumber,
            lang: lang,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Une erreur est survenue lors de la création de la session de paiement.");
        }

        const { url } = await response.json();
        window.location.href = url;
      } catch (error: any) {
        console.error("Booking Error:", error);
        setBookingError(error.message);
        alert("Erreur: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Mock logic for other payment methods (e.g., cash)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep(5);
      setLoading(false);
    }
  };

  return (
    <>
      {/* OVERLAY MENU */}
      <div 
        id="mobile-menu" 
        className={`fixed inset-0 bg-stone-950/95 backdrop-blur-xl z-[100] flex flex-col justify-center items-center transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-6 text-white/90 hover:text-white transition-all active:scale-90 p-2" 
          aria-label="Close Menu"
        >
          <X size={32} strokeWidth={1.5} />
        </button>
        <nav className="flex flex-col items-center gap-10 text-xl tracking-tight font-normal">
          <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="menu-link hover:text-stone-400 transition-colors uppercase tracking-[0.1em] text-sm font-medium">{t('nav_services')}</a>
          <a href="#fleet" onClick={() => setIsMobileMenuOpen(false)} className="menu-link hover:text-stone-400 transition-colors uppercase tracking-[0.1em] text-sm font-medium">{t('nav_fleet')}</a>
          <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="menu-link hover:text-stone-400 transition-colors uppercase tracking-[0.1em] text-sm font-medium">{t('nav_gallery')}</a>
          <a href="#business" onClick={() => setIsMobileMenuOpen(false)} className="menu-link hover:text-stone-400 transition-colors uppercase tracking-[0.1em] text-sm font-medium">{t('nav_business')}</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="menu-link hover:text-stone-400 transition-colors uppercase tracking-[0.1em] text-sm font-medium">{t('nav_contact')}</a>
          
          <div className="flex gap-6 mt-6 pt-10 border-t border-white/10 w-48 justify-center">
            <button 
              onClick={() => { setLang('fr'); setIsMobileMenuOpen(false); }}
              className={`text-xs font-bold tracking-[0.2em] uppercase transition-all ${lang === 'fr' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              FR
            </button>
            <div className="w-px h-4 bg-white/10"></div>
            <button 
              onClick={() => { setLang('en'); setIsMobileMenuOpen(false); }}
              className={`text-xs font-bold tracking-[0.2em] uppercase transition-all ${lang === 'en' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              EN
            </button>
          </div>

          <div className="flex items-center gap-10 mt-8">
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95" aria-label="TikTok">
              <iconify-icon icon="ic:baseline-tiktok" width="24"></iconify-icon>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95" aria-label="Instagram">
              <Instagram size={24} strokeWidth={1.5} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95" aria-label="LinkedIn">
              <Linkedin size={24} strokeWidth={1.5} />
            </a>
          </div>
        </nav>
      </div>

      {/* BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://a.storyblok.com/f/312129/4096x2731/cee1283139/chauffeur_1.jpg/m/2560x0/filters:format(webp)" 
          alt="Premium Service Background" 
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-stone-950/50"></div>
      </div>

      {/* SCROLL TO THE ABSOLUT TOP OF THE PAGE (ABOVE HEADER & SPEC LOGO) */}
      <div id="top" className="absolute top-0 left-0 w-full h-0 pointer-events-none" />
      <div id="hero" className="absolute top-0 left-0 w-full h-0 pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-50 flex items-center justify-between px-6 py-5 w-full max-w-7xl mx-auto">
        <div className="w-10 flex justify-start">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white/90 hover:text-white transition-all active:scale-90 p-2 -ml-2" 
            aria-label="Menu"
          >
            <Menu size={24} strokeWidth={1.5} className="md:w-7 md:h-7" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center text-center px-2">
          <div className="flex items-end gap-1 mb-1.5 h-5 md:h-6 opacity-90">
            <div className="w-1 h-4 md:h-5 bg-white rounded-t-sm"></div>
            <div className="w-1 h-2.5 md:h-3 bg-white/60 rounded-t-sm"></div>
            <div className="w-1 h-5 md:h-6 bg-white rounded-t-sm"></div>
            <div className="w-1 h-3 md:h-4 bg-white/60 rounded-t-sm"></div>
            <div className="w-1 h-4 md:h-5 bg-white rounded-t-sm"></div>
          </div>
          <h1 className="text-[15px] md:text-lg font-normal tracking-[0.18em] md:tracking-[0.25em] uppercase text-white/90 whitespace-nowrap">Safeness transport</h1>
          <p className="text-[11px] md:text-xs tracking-[0.1em] md:tracking-[0.15em] text-white/50 uppercase mt-0.5 whitespace-nowrap">Global Chauffeur Network</p>
        </div>

        <div className="w-10 flex justify-end relative group/lang">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsLangMenuOpen(!isLangMenuOpen);
            }}
            className="text-white/90 hover:text-white transition-all active:scale-90 p-2 -mr-2" 
            aria-label="Languages"
          >
            <Globe size={24} strokeWidth={1.5} className="md:w-7 md:h-7" />
          </button>
          <div 
            className={`absolute right-0 top-full mt-1 w-40 bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 z-50 ${isLangMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
          >
            <button 
              onClick={() => { setLang('fr'); setIsLangMenuOpen(false); }}
              className={`w-full text-left px-5 py-4 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-between group/item ${lang === 'fr' ? 'text-white bg-white/5' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <span>{t('lang_fr')}</span>
              {lang === 'fr' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
            </button>
            <div className="h-px w-full bg-white/5"></div>
            <button 
              onClick={() => { setLang('en'); setIsLangMenuOpen(false); }}
              className={`w-full text-left px-5 py-4 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-between group/item ${lang === 'en' ? 'text-white bg-white/5' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <span>{t('lang_en')}</span>
              {lang === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="relative z-10 flex flex-col items-center pt-20 pb-32 px-4 text-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 text-[13px] font-normal tracking-wide text-white/80 mb-10 max-w-2xl shadow-xl uppercase"
        >
          {t('hero_badge')}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="relative inline-block pb-1 mb-[2px] md:mb-1">
            <h2 className="text-[51px] leading-none md:text-7xl font-semibold tracking-[0.02em] uppercase text-white drop-shadow-sm">{t('hero_brand')}</h2>
            <div className="absolute bottom-0 left-[15%] right-[15%] h-px bg-zinc-300 rounded-full opacity-80"></div>
          </div>
          <h2 className="text-[51px] leading-none md:text-7xl font-semibold tracking-[0.02em] uppercase text-white drop-shadow-sm mt-[2px] md:mt-1">{t('hero_worldwide')}</h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col items-center"
        >
          <a 
            href="#booking"
            className="bg-white text-stone-950 px-10 py-4 rounded-full font-normal text-base hover:bg-stone-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            {t('hero_book')}
          </a>
          <a href="#booking" className="mt-8 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors uppercase font-normal tracking-wider group">
            {t('hero_estimate')}
            <iconify-icon icon="solar:arrow-right-linear" width="20" style={{ strokeWidth: 1.5 }} class="group-hover:translate-x-1 transition-transform"></iconify-icon>
          </a>
        </motion.div>
        
        <div className="mt-20 relative w-full max-w-md">
          <div className="border border-white/10 rounded-[2.5rem] p-8 pb-10 flex flex-col items-center justify-center bg-stone-950/30 backdrop-blur-sm shadow-2xl h-[180px] overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentCityIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
                className="w-full h-full flex flex-col items-center justify-center absolute inset-0"
              >
                <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-black/20 overflow-hidden shadow-xl">
                  <iconify-icon icon={cities[currentCityIndex].icon} width="44"></iconify-icon>
                </div>
                <span className="text-base font-normal tracking-[0.2em] uppercase text-white/90">{cities[currentCityIndex].name}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <button 
            onClick={nextCity}
            className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-stone-950 rounded-full flex items-center justify-center shadow-xl hover:bg-stone-200 transition-colors z-20" 
            aria-label="Next Location"
          >
            <iconify-icon icon="solar:alt-arrow-right-linear" width="20" style={{ strokeWidth: 1.5 }}></iconify-icon>
          </button>
        </div>
      </main>

      {/* SCROLLABLE CONTENT LAYER */}
      <div className="relative z-20 -mt-16 w-full flex flex-col">

        {/* SVG curve */}
        <svg className="w-full h-16 md:h-24 text-stone-900 block" preserveAspectRatio="none" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 24C480 -8 960 -8 1440 24V74H0V24Z" fill="currentColor"/>
        </svg>

        {/* Intro & Trust */}
        <div className="bg-stone-900 w-full pt-8 pb-32 flex flex-col items-center text-center overflow-hidden">
          <div className="px-6 mb-24 text-base font-normal text-stone-400 tracking-wide">
            <p className="uppercase tracking-[0.15em] mb-1">Est. 2018,</p>
            <h3 className="text-4xl md:text-5xl font-semibold tracking-tight uppercase text-white/90">Excellence</h3>
          </div>
          <div className="w-full pt-16 border-t border-white/5 relative">
            <p className="text-xs font-normal text-white/50 tracking-[0.2em] mb-12 uppercase">Corporate Partners</p>
            
            {/* Infinite Marquee */}
            <div className="relative flex overflow-hidden w-full">
              <div className="animate-marquee flex whitespace-nowrap w-max">
                <div className="flex items-center gap-12 md:gap-24 px-6 md:px-12 flex-none">
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/uniformation.png" alt="Uniformation" className="h-6 object-contain brightness-0 invert opacity-60" />
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/2560px-Prada-Logo.svg-1024x159-1.webp" alt="Prada" className="h-4 object-contain brightness-0 invert opacity-60" />
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/1200px-Vaisala_logo.svg.png" alt="Vaisala" className="h-6 object-contain brightness-0 invert opacity-60" />
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/ETSGlobal_logo.a83452a9.png" alt="ETS Global" className="h-8 object-contain brightness-0 invert opacity-60" />
                </div>
                <div className="flex items-center gap-12 md:gap-24 px-6 md:px-12 flex-none">
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/uniformation.png" alt="Uniformation" className="h-6 object-contain brightness-0 invert opacity-60" />
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/2560px-Prada-Logo.svg-1024x159-1.webp" alt="Prada" className="h-4 object-contain brightness-0 invert opacity-60" />
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/1200px-Vaisala_logo.svg.png" alt="Vaisala" className="h-6 object-contain brightness-0 invert opacity-60" />
                  <img src="https://mcslimo.fr/wp-content/uploads/2023/04/ETSGlobal_logo.a83452a9.png" alt="ETS Global" className="h-8 object-contain brightness-0 invert opacity-60" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COUVERTURE EUROPE - REDESIGNED BENTO GRID */}
        <section 
          id="europe"
          className="bg-stone-900 w-full py-32 px-6 border-t border-white/5 relative overflow-hidden"
        >
          {/* Decorative background elements: Subtle map-inspired lines (always visible on mobile and desktop) */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M10,20 Q40,10 70,30 T90,80" fill="none" stroke="white" strokeWidth="0.05" strokeDasharray="1,2" />
              <path d="M20,70 Q50,60 80,90" fill="none" stroke="white" strokeWidth="0.05" strokeDasharray="1,2" />
              <path d="M5,50 L95,50" fill="none" stroke="white" strokeWidth="0.02" strokeDasharray="2,4" />
            </svg>
          </div>
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[0] = el; }}
            className="max-w-7xl mx-auto relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="grid lg:grid-cols-12 gap-12 mb-12 items-end"
            >
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                  <Globe size={12} className="text-white/60" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('europe_tag')}</span>
                </div>
                <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">
                  {t('europe_title')} <br/> 
                  <span className="font-bold">{t('europe_subtitle')}</span>
                </h2>
              </div>
              <div className="lg:col-span-6 lg:border-l lg:border-white/10 lg:pl-12">
                <p className="text-stone-300/90 text-[15px] md:text-[17px] font-normal leading-relaxed max-w-lg mb-0 italic">
                  {t('europe_desc')}
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-4 h-auto lg:h-[550px]">
              
              {/* PARIS: Main Hub - Large Bento Item */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-2 lg:row-span-2 group relative border border-white/10 rounded-[2.4rem] overflow-hidden"
              >
                <img 
                  src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop" 
                  alt="Paris" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 md:opacity-80 group-hover:opacity-95"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 md:from-stone-950/95 via-stone-950/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 lg:bottom-12 lg:left-12 lg:right-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-md">
                      <iconify-icon icon="solar:map-point-bold" width="24" className="text-white"></iconify-icon>
                    </div>
                    <span className="text-white/40 text-xs uppercase tracking-[0.2em] font-medium">{t('europe_hub_tag')}</span>
                  </div>
                  <h3 className="text-4xl font-semibold text-white uppercase tracking-tight mb-4">{t('europe_hub_title')}</h3>
                  <p className="text-stone-300 text-sm font-light max-w-sm line-clamp-2 md:line-clamp-none">
                    {t('europe_hub_desc')}
                  </p>
                </div>
              </motion.div>

              {/* MUNICH */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full"
              >
                <img 
                  src="https://images.unsplash.com/photo-1595867818082-083862f3d630?q=80&w=2070&auto=format&fit=crop" 
                  alt="Munich" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 md:opacity-80 group-hover:opacity-95"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 md:from-stone-950/95 via-stone-950/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-xl font-semibold text-white uppercase tracking-wider">Munich</h3>
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-[0.1em]">{t('europe_munich_tag')}</span>
                </div>
              </motion.div>

              {/* MILAN */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full"
              >
                <img 
                  src="https://images.unsplash.com/photo-1610016302534-6f67f1c968d8?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=ouael-ben-salah-0xe2FGo7Vc0-unsplash.jpg" 
                  alt="Milan" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 md:opacity-80 group-hover:opacity-95"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 md:from-stone-950/95 via-stone-950/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-xl font-semibold text-white uppercase tracking-wider">Milan</h3>
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-[0.1em]">{t('europe_milan_tag')}</span>
                </div>
              </motion.div>

              {/* BERLIN */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full"
              >
                <img 
                  src="https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=2070&auto=format&fit=crop" 
                  alt="Berlin" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 md:opacity-80 group-hover:opacity-95"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 md:from-stone-950/95 via-stone-950/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-xl font-semibold text-white uppercase tracking-wider">Berlin</h3>
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-[0.1em]">{t('europe_berlin_tag')}</span>
                </div>
              </motion.div>

              {/* FRANCE / AMSTERDAM Hybrid Duo */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full bg-stone-800/40"
              >
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white uppercase mb-2 tracking-tight">{t('europe_connect_title')}</h3>
                    <p className="text-stone-400 text-[13px] font-light leading-relaxed">
                      {t('europe_connect_desc')}
                    </p>
                  </div>
                  <div className="flex -space-x-4">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="w-10 h-10 rounded-full border-2 border-stone-900 overflow-hidden">
                        <img src={`https://picsum.photos/seed/${n+20}/100/100`} alt="chauffeur" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-stone-900 bg-white/10 flex items-center justify-center backdrop-blur-sm text-[10px] font-bold text-white">+ Hubs</div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Section Nos Services */}
        <section id="services" className="bg-stone-925 w-full py-32 border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 px-6">
            {/* Header with standard project SPEC - Split Layout */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="grid lg:grid-cols-12 gap-12 items-end"
            >
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                  <Briefcase size={12} className="text-white/60" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('services_tag')}</span>
                </div>
                <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">
                  {t('services_title')}
                </h2>
                <div className="h-1 w-12 bg-white/20 rounded-full mt-10"></div>
              </div>
              <div className="lg:col-span-6 lg:border-l lg:border-white/10 lg:pl-12 flex flex-col items-start gap-8">
                <p className="text-stone-300/90 text-[15px] md:text-[17px] font-normal leading-relaxed mb-0 italic">
                  {t('services_desc')}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Horizontal Scroll Layout - Version Full-Width "Hors Cadre" */}
          <div className="relative mt-20 overflow-hidden">
            {/* Native Horizontal Scroll Container with Edge Bleed */}
            <div 
              ref={servicesScrollRef}
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory px-6 lg:px-0 lg:pl-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] no-scrollbar"
            >
              {[
                { 
                  icon: <Building2 size={22} />, 
                  img: "https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/Image_6_tf7z1r",
                  features: [t('service1_feat1'), t('service1_feat2'), t('service1_feat3')]
                },
                { 
                  icon: <Navigation size={22} />, 
                  img: "https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/Image_1_vuxvex",
                  features: [t('service2_feat1'), t('service2_feat2'), t('service2_feat3')]
                },
                { 
                  icon: <MapPin size={22} />, 
                  img: "https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/Image_2_ktc2ce",
                  features: [t('service3_feat1'), t('service3_feat2'), t('service3_feat3')]
                },
                { 
                  icon: <Briefcase size={22} />, 
                  img: "https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/Image_3_s2urdg",
                  features: [t('service4_feat1'), t('service4_feat2'), t('service4_feat3')]
                },
                { 
                  icon: <Calendar size={22} />, 
                  img: "https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/Image_4_djvs21",
                  features: [t('service5_feat1'), t('service5_feat2'), t('service5_feat3')]
                }
              ].map((service, i) => (
                <motion.div 
                  key={`card-${i}`} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveServiceCard(activeServiceCard === i ? null : i)}
                  className={`w-[79.5vw] md:w-[calc(50%-12px)] lg:w-[420px] h-[500px] md:h-[495px] border border-white/10 rounded-[2.5rem] bg-stone-950 shadow-sm shadow-black/5 flex flex-col shrink-0 group overflow-hidden snap-center relative cursor-pointer transition-colors ${activeServiceCard === i ? 'border-white/30' : ''}`}
                >
                  {/* Full Card Background Image */}
                  <img 
                    src={service.img}
                    alt={t(`service${i + 1}_title`)}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${activeServiceCard === i ? 'opacity-90 scale-105' : 'opacity-85 md:opacity-70 group-hover:opacity-90'}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 md:from-stone-950 via-stone-950/20 to-transparent"></div>

                  {/* Overlay Content */}
                  <div className="relative z-10 h-full p-8 md:p-10 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 transition-all backdrop-blur-md ${activeServiceCard === i ? 'bg-white/20 text-white border-white/30' : 'group-hover:bg-white/10 group-hover:border-white/20'}`}>
                        {service.icon}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="mb-4 space-y-3">
                        <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight leading-tight">
                           {t(`service${i + 1}_title`)}
                        </h3>
                        <p className="text-stone-400 text-[15px] font-light leading-relaxed">
                          {t(`service${i + 1}_desc`)}
                        </p>
                      </div>

                      <motion.div
                        initial={false}
                        animate={{ 
                          height: activeServiceCard === i ? 'auto' : '0px',
                          opacity: activeServiceCard === i ? 1 : 0
                        }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="overflow-hidden flex flex-col gap-5"
                      >
                        <ul className="space-y-2 opacity-80">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-[11px] text-white/70 uppercase tracking-wider font-medium">
                              <div className="w-1 h-1 rounded-full bg-white/30" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <div className="pt-2">
                          <a 
                            href="#booking"
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all group/btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('service_more')}
                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                          </a>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* Extra spacer to allow last card clean finish */}
              <div className="w-6 lg:w-12 shrink-0"></div>
            </div>
            
            {/* Navigation Arrows and Scroll Hint */}
            <div className="max-w-7xl mx-auto px-6 mt-4 flex justify-between items-center">
              <div className="flex gap-4">
                <motion.button 
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollServices('prev')}
                  className="w-[54.72px] h-[54.72px] md:w-[57.6px] md:h-[57.6px] flex items-center justify-center text-white border border-white/10 rounded-full transition-colors"
                  aria-label="Previous service"
                >
                  <ArrowLeft className="w-[17.1px] h-[17.1px] md:w-[18px] md:h-[18px]" strokeWidth={1.5} />
                </motion.button>

                <motion.button 
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollServices('next')}
                  className="w-[54.72px] h-[54.72px] md:w-[57.6px] md:h-[57.6px] flex items-center justify-center text-white border border-white/10 rounded-full transition-colors"
                  aria-label="Next service"
                >
                  <ArrowRight className="w-[17.1px] h-[17.1px] md:w-[18px] md:h-[18px]" strokeWidth={1.5} />
                </motion.button>
              </div>
              
            </div>
          </div>
        </section>

        {/* Section Transferts Populaires */}
        <section id="transfers" className="bg-stone-900 w-full py-32 border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 px-6">
             {/* Header with standard project SPEC */}
             <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center mb-16 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Tag size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('transfers_tag')}</span>
              </div>
              <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm text-center leading-[1.25] md:leading-snug">
                {t('transfers_title')}
              </h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
              <p className="text-stone-300/90 text-lg font-normal leading-relaxed max-w-3xl mt-12 text-center italic">
                {t('transfers_desc')}
              </p>
            </motion.div>

            {/* Transfers Grid - Static Tall Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'route_cdg', price: '120€', time: '45 min', icon: <Navigation size={20} />, image: 'https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/603b4374-0730-4377-a001-ab58e60cb33d_l6ue2k' },
                { key: 'route_orly', price: '120€', time: '35 min', icon: <MapPin size={20} />, image: 'https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/39169e3d-ae4f-46b7-a9a0-9aee8857f11a_wzsemp' },
                { key: 'route_disney', price: '120€', time: '50 min', icon: <Sparkles size={20} />, image: 'https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/b04fc1f4-3d8d-4e87-89a5-7d9dd8d174ae_jw5xtm' },
                { key: 'route_versailles', price: '90€', time: '40 min', icon: <Building2 size={20} />, image: 'https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/39169e3d-ae4f-46b7-a9a0-9aee8857f11a_wzsemp' },
                { key: 'route_giverny', price: '250€', time: '75 min', icon: <Palette size={20} />, image: 'https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/39169e3d-ae4f-46b7-a9a0-9aee8857f11a_wzsemp', lgOnly: true },
                { key: 'route_beauvais', price: '140€', time: '80 min', icon: <Plane size={20} />, image: 'https://res.cloudinary.com/dopnnowvl/image/upload/f_auto,q_auto/39169e3d-ae4f-46b7-a9a0-9aee8857f11a_wzsemp', lgOnly: true },
              ].map((item: any, i) => {
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10px" }}
                    transition={{ duration: 0.8, delay: i * 0.15 }}
                    className={`group relative border rounded-[2.5rem] transition-colors duration-500 overflow-hidden h-[320px] bg-stone-900 border-white/10 hover:border-white/20 shadow-2xl ${item.lgOnly ? 'hidden lg:flex' : 'flex'} flex-col`}
                  >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={item.image} 
                        alt={t(item.key)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 md:opacity-80 group-hover:opacity-95"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 md:from-stone-950/95 via-stone-950/20 to-transparent"></div>
                    </div>

                    <div className="p-8 relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-4 w-full">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white text-stone-900 shadow-xl shrink-0">
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white leading-tight">
                              {t(item.key)}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Content always visible */}
                      <div className="mt-auto space-y-5">
                        <div className="border-t border-white/10 pt-5">
                          <div className="flex items-center text-white/60 text-[9px] font-bold uppercase tracking-[0.2em] mb-5">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-white/40" />
                              <span>{item.time}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <span className="block text-[8px] uppercase tracking-widest text-white/30 mb-1">{t('total')}</span>
                              <span className="text-3xl font-bold text-white tracking-tighter">{item.price}</span>
                            </div>
                            <button 
                              onClick={() => {
                                setStep(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-stone-900 transition-all shadow-lg active:scale-95"
                            >
                              <ArrowRight size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>




        {/* BUSINESS B2B */}
        <section 
          id="business" 
          className="bg-[#181514] w-full py-28 md:py-32 px-6 relative overflow-hidden"
        >

          {/* Decorative rounded SVG background (fluid curves & organic luxury waves on corners and edges only) */}
          <div className="absolute inset-0 opacity-[0.04] select-none pointer-events-none mix-blend-screen overflow-hidden">
            <svg className="w-full h-full min-w-[1024px]" viewBox="0 0 1440 800" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Top-Left Corner Waves (stays completely on the left/top corner) */}
              <path d="M-50,50 C180,80 120,400 -50,550" stroke="white" strokeWidth="0.75" />
              <path d="M-50,80 C150,110 90,370 -50,520" stroke="white" strokeWidth="0.5" strokeDasharray="6 6" />
              
              {/* Bottom-Left Corner Waves */}
              <path d="M-50,580 C180,600 420,720 520,850" stroke="white" strokeWidth="0.75" />
              <path d="M-50,610 C150,630 390,730 490,850" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />

              {/* Top-Right Corner Waves (stays completely on the right/top corner) */}
              <path d="M1490,50 C1260,80 1320,400 1490,550" stroke="white" strokeWidth="0.75" />
              <path d="M1490,80 C1290,110 1350,370 1490,520" stroke="white" strokeWidth="0.5" strokeDasharray="6 6" />

              {/* Bottom-Right Corner Waves */}
              <path d="M920,850 C1020,720 1260,600 1490,580" stroke="white" strokeWidth="0.75" />
              <path d="M950,850 C1050,730 1290,630 1490,610" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />

              {/* Ambient rings confined entirely to outer edges */}
              <circle cx="0" cy="350" r="150" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
              <circle cx="0" cy="350" r="240" stroke="white" strokeWidth="0.5" opacity="0.2" />
              
              <circle cx="1440" cy="450" r="150" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
              <circle cx="1440" cy="450" r="240" stroke="white" strokeWidth="0.5" opacity="0.2" />
            </svg>
          </div>

          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto relative z-10"
          >


            <div className="grid lg:grid-cols-2 gap-y-14 lg:gap-16 items-center">
              <div className="flex flex-col text-left text-base font-light text-stone-400 tracking-wide">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-7 md:mb-8 w-fit">
                  <Briefcase size={12} className="text-white/60" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('corp_tag')}</span>
                </div>
                <h2 className="text-[38px] md:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">
                  {t('corp_subtitle')}
                </h2>
                <div className="h-1 w-12 bg-white/20 rounded-full mt-7 md:mt-8 mb-10"></div>
                <p className="text-stone-300/90 text-lg font-normal leading-relaxed italic mb-8 max-w-xl">
                  {t('corp_desc')}
                </p>
                <ul className="flex flex-col gap-4 mb-10 lg:mb-12">
                  <li className="flex items-start gap-3 text-stone-200">
                    <SolarCheckCircleLinear size={20} className="text-white mt-1 shrink-0" strokeWidth={1.5} />
                    <span className="font-normal text-[15px]">{t('corp_li1')}</span>
                  </li>
                  <li className="flex items-start gap-3 text-stone-200">
                    <SolarCheckCircleLinear size={20} className="text-white mt-1 shrink-0" strokeWidth={1.5} />
                    <span className="font-normal text-[15px]">{t('corp_li2')}</span>
                  </li>
                  <li className="flex items-start gap-3 text-stone-200">
                    <SolarCheckCircleLinear size={20} className="text-white mt-1 shrink-0" strokeWidth={1.5} />
                    <span className="font-normal text-[15px]">{t('corp_li3')}</span>
                  </li>
                </ul>
                <a href="#hero" className="flex text-base text-white font-normal border-b border-white/20 pb-1 w-fit hover:border-white transition-colors items-center gap-2">
                  {t('corp_cta')}
                  <SolarArrowRightUpLinear size={16} />
                </a>
              </div>

              <div className="flex flex-col gap-6 lg:gap-0 w-full">
                <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-stone-900/50 flex items-end justify-center p-8">
                  <img 
                    src="https://i.ibb.co/HL730gdy/Image.jpg" 
                    alt="Chauffeur Service background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/15"></div>
                  <div className="w-full max-w-sm border border-white/10 rounded-2xl bg-stone-800/85 backdrop-blur-md p-6 relative z-10 shadow-2xl">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <User size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-white font-medium">{t('vip_guest')}</div>
                          <div className="text-xs text-stone-500">{t('vip_flight')}</div>
                        </div>
                      </div>
                      <span className="text-xs text-stone-400 bg-white/5 px-2 py-1 rounded">{t('vip_tag')}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">{t('vip_pickup_label')}</span>
                        <span className="text-white">{t('vip_pickup_val')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">{t('vip_dropoff_label')}</span>
                        <span className="text-white">{t('vip_dropoff_val')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">{t('vip_vehicle_label')}</span>
                        <span className="text-white">{t('vip_vehicle_val')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </motion.div>
      </section>

        {/* Flotte */}
        <div id="fleet" className="bg-stone-925 w-full py-32 flex flex-col items-center border-t border-white/5 relative overflow-hidden">
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[7] = el; }}
            className="max-w-7xl mx-auto px-6 w-full reveal relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center mb-24 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Navigation size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('fleet_tag')}</span>
              </div>
              <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">{t('fleet_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-base font-light text-stone-400 tracking-wide">
              {[
                { type: 'Business', model: 'Classe E', img: 'https://mcslimo.fr/wp-content/uploads/2023/04/eclass.png', pax: `3 ${t('passengers')}`, bag: `3 ${t('luggage')}` },
                { type: 'Premium', model: 'Classe V', img: 'https://mcslimo.fr/wp-content/uploads/2023/04/vclass.png', pax: `7 ${t('passengers')}`, bag: `7 ${t('luggage')}`, isPremium: true },
                { type: 'Luxe', model: 'Classe S', img: 'https://mcslimo.fr/wp-content/uploads/2023/04/sclass.png', pax: `3 ${t('passengers')}`, bag: `3 ${t('luggage')}` }
              ].map((car, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.2 }}
                  className={`border ${car.isPremium ? 'border-white/20 bg-stone-800/40' : 'border-white/10 bg-stone-900/30'} rounded-[2.5rem] p-8 flex flex-col items-center backdrop-blur-sm shadow-2xl relative overflow-hidden group`}
                >
                  {car.isPremium && <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>}
                  <span className={`${car.isPremium ? 'bg-white text-stone-950' : 'bg-white/5 border border-white/10 text-white/80'} rounded-full px-5 py-2 text-xs font-normal tracking-[0.2em] uppercase mb-8 shadow-lg`}>
                    {car.type}
                  </span>
                  <h3 className="text-3xl font-bold tracking-tight uppercase text-white/90 mb-10">{car.model}</h3>
                  <div className="w-full aspect-[4/3] flex items-center justify-center mb-10 bg-white rounded-3xl p-6">
                    <img src={car.img} alt={car.model} className="w-full object-contain group-hover:scale-105 transition-transform duration-700 mix-blend-multiply" referrerPolicy="no-referrer" />
                  </div>
                  <div className={`w-full grid grid-cols-2 gap-y-6 pt-8 border-t ${car.isPremium ? 'border-white/20' : 'border-white/10'}`}>
                    <div className="flex items-center gap-3 justify-center">
                      <SolarUsersGroup size={20} className={car.isPremium ? 'text-white/60' : 'text-white/40'} strokeWidth={1.5} />
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>{car.pax}</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <SolarCaseMinimalistic size={20} className={car.isPremium ? 'text-white/60' : 'text-white/40'} strokeWidth={1.5} />
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>{car.bag}</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <SolarWifiRouter size={20} className={car.isPremium ? 'text-white/60' : 'text-white/40'} strokeWidth={1.5} />
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>Wi-Fi Inclus</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <SolarBottle size={20} className={car.isPremium ? 'text-white/60' : 'text-white/40'} />
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>Boissons</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* GALERIE */}
        <section 
          id="gallery" 
          className="bg-stone-900 w-full py-32 border-t border-white/5 relative overflow-hidden"
        >
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[4] = el; }}
            className="w-full reveal relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-6xl mx-auto px-6 flex flex-col items-center mb-16 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Star size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('vision_tag')}</span>
              </div>
              <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">{t('vision_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
              <p className="text-stone-300/90 text-lg font-normal leading-relaxed max-w-3xl mt-8 text-center italic">
                {t('vision_desc')}
              </p>
            </motion.div>
            
            <div className="relative overflow-hidden py-4 w-full">
              {/* Gradients pour l'effet de disparition */}
              <div className="absolute left-0 top-0 bottom-0 w-32 z-20 bg-gradient-to-r from-stone-900 via-stone-900/50 to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 z-20 bg-gradient-to-l from-stone-900 via-stone-900/50 to-transparent pointer-events-none"></div>

              <div 
                className={`flex gap-3 md:gap-6 w-max animate-marquee-slow ${isGalleryPaused ? '[animation-play-state:paused]' : ''}`}
                onMouseEnter={() => setIsGalleryPaused(true)}
                onMouseLeave={() => setIsGalleryPaused(false)}
              >
                {[...Array(4)].map((_, setIndex) => (
                  <Fragment key={`set-${setIndex}`}>
                    {/* Image 1: Portrait Interior */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 aspect-[3/4] h-[384px] md:h-[420px] flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1629019878688-f5d58a41b188?q=85&fm=jpg&crop=entropy&cs=srgb" 
                        alt={t('gallery_img1_alt')} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-950/5 group-hover:bg-transparent transition-colors duration-500"></div>
                    </div>

                    {/* Image 2: Portrait Center Detail */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 aspect-[3/4] h-[384px] md:h-[420px] flex-shrink-0">
                      <img 
                        src="https://prestige-transfer-london.com/transfer/mercedes-v-londone_web.jpg" 
                        alt={t('gallery_img2_alt')} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-950/5 group-hover:bg-transparent transition-colors duration-500"></div>
                    </div>

                    {/* Image 3: Portrait End Detail */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 aspect-[3/4] h-[384px] md:h-[420px] flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1720731035872-7aa3708996c1?q=85&fm=jpg&crop=entropy&cs=srgb" 
                        alt={t('gallery_img3_alt')} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-950/5 group-hover:bg-transparent transition-colors duration-500"></div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AVIS CLIENTS */}
        <section 
          id="reviews"
          ref={reviewsRef}
          className="bg-stone-900 w-full py-32 px-6 border-t border-white/5 relative overflow-hidden"
        >
          <div 
            ref={el => { if (el) revealRefs.current[2] = el; }}
            className="max-w-7xl mx-auto reveal relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center mb-12 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <MessageSquare size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('reviews_tag')}</span>
              </div>
              <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">{t('reviews_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
              
              <div className="flex items-center gap-4 mt-12 bg-white/[0.03] border border-white/10 px-6 py-3 rounded-full max-w-max mx-auto backdrop-blur-md shadow-lg shadow-black/10">
                {/* Brand Logo */}
                <div className="flex items-center justify-center">
                  <iconify-icon icon="logos:google-icon" width="22"></iconify-icon>
                </div>
                
                {/* Text & Underneath Stars */}
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-white font-bold text-sm tracking-wide">
                    Google
                  </span>
                  {/* Stars */}
                  <div className="flex text-[#FBBC05] gap-0.5">
                    <SolarStarBold size={12} />
                    <SolarStarBold size={12} />
                    <SolarStarBold size={12} />
                    <SolarStarBold size={12} />
                    <SolarStarBold size={12} />
                  </div>
                </div>
              </div>
            </motion.div>

            <div 
              className="relative pt-4 pb-2"
              onMouseEnter={() => setIsReviewsPaused(true)}
              onMouseLeave={() => setIsReviewsPaused(false)}
            >
              {/* Slider Container */}
              <div className="overflow-hidden px-0">
                <motion.div 
                  className="flex will-change-transform"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  animate={{ 
                    x: `-${currentReviewIndex * (100 / itemsPerPage)}%` 
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.23, 1, 0.32, 1] 
                  }}
                >
                  {reviews.map((review, i) => (
                    <div 
                      key={`rev-${i}`} 
                      className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-3 flex flex-col transform-gpu"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="h-full border border-white/5 rounded-3xl p-8 bg-white/[0.03] backdrop-blur-md shadow-none flex flex-col hover:bg-white/[0.05] hover:border-white/10 transition-colors duration-500">
                        <div className="flex gap-1 text-[#FBBC05] mb-8">
                          {[...Array(5)].map((_, idx) => (
                            <SolarStarBold key={idx} size={18} />
                          ))}
                        </div>
                        <p className="leading-relaxed mb-8 text-stone-200/90 font-light text-[15px] italic flex-grow">
                          "{review.text}"
                        </p>
                        <div className="flex items-center gap-4 pt-6 border-t border-white/5 mt-auto">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-white">
                            {review.initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white/95">{review.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <SolarCheckCircleBold size={12} className="text-emerald-500" />
                              <span className="text-[10px] text-stone-500 uppercase tracking-[0.1em] font-bold">{t('verified_label')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2.5 mt-10">
                {Array.from({ length: Math.max(1, reviews.length - itemsPerPage + 1) }).map((_, i) => (
                  <button
                    key={`dot-${i}`}
                    onClick={() => setCurrentReviewIndex(i)}
                    className={`h-1 rounded-full transition-all duration-700 ${currentReviewIndex === i ? 'bg-white w-10' : 'bg-white/10 w-2 hover:bg-white/25'}`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Booking / Estimate Form */}
        <section id="booking" className="bg-stone-925 w-full py-32 flex flex-col items-center border-t border-white/5 relative overflow-hidden">
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center mb-16 text-center px-3 md:px-6 relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
              <Calendar size={12} className="text-white/60" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">Booking</span>
            </div>
            <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">{t('title')}</h2>
            <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
          </motion.div>
          
          <div ref={bookingRef} className="w-full max-w-6xl mx-auto px-4 md:px-6 relative z-10">
            {/* Mobile-only Step Indicators Block */}
            <div className="md:hidden w-full mb-4">
              <div className="w-full flex items-center justify-between py-5 px-4 rounded-xl bg-white border border-stone-100 shadow-xl">
                {[1, 2, 3, 4].map((s) => (
                  <Fragment key={s}>
                    <button
                      onClick={() => {
                          setStep(s);
                      }}
                      className="flex items-center justify-center focus:outline-none"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-500 ${step >= s ? 'bg-stone-900 text-white shadow-lg scale-110' : 'bg-stone-100 text-stone-400 border border-stone-50'}`}>
                        {s}
                      </div>
                    </button>
                    {s < 4 && (
                      <div className="flex-1 h-px mx-2 relative">
                        <div className="absolute inset-0 bg-stone-100"></div>
                        <div className={`absolute inset-0 bg-stone-900 transition-all duration-700 ${step > s ? 'w-full' : 'w-0'}`}></div>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[1rem] shadow-2xl overflow-hidden border border-white/10">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Left Side: Form */}
                <div className="col-span-full lg:col-span-7 px-5 py-6 md:p-12 border-b lg:border-b-0 lg:border-r border-stone-100">
                  {/* Progress - Desktop Only */}
                  <div className="hidden md:flex items-center gap-4 mb-8 md:mb-12">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                          {s}
                        </div>
                        {s < 4 && <div className={`w-8 h-px ${step > s ? 'bg-stone-900' : 'bg-stone-200'}`}></div>}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Ride Details */}
                  {step === 1 && (
                    <div className="space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {bookingError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3.5 rounded-xl text-xs md:text-sm font-medium animate-in fade-in duration-300">
                          {bookingError}
                        </div>
                      )}
                      
                      <div className="space-y-2 relative flex flex-col">
                        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('itinerary_label')}</label>
                        
                        <div className="relative border border-stone-300 rounded-xl bg-white overflow-visible">
                          {/* Pickup Field */}
                          <motion.div layout className={`relative ${suggestions.pickup.length > 0 ? 'z-40' : 'z-20'}`}>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-800" size={18} />
                              <input 
                                ref={pickupInputRef}
                                type="text" 
                                value={bookingData.pickup}
                                onChange={(e) => {
                                  setBookingData(prev => ({ ...prev, pickup: e.target.value, pickupCoords: null }));
                                  searchAddress(e.target.value, 'pickup');
                                  if (bookingError) setBookingError(null);
                                }}
                                placeholder={t('pickup_placeholder')} 
                                className="w-full bg-transparent border-none py-4 md:py-5 pl-12 pr-4 text-stone-950 text-[16px] font-medium placeholder:text-stone-700/90 focus:ring-0 outline-none transition-all"
                              />
                            </div>
                            {suggestions.pickup.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-stone-300 rounded-xl overflow-hidden shadow-xl top-full">
                                {suggestions.pickup.map((item, i) => (
                                  <button 
                                    key={i}
                                    type="button"
                                    onClick={() => selectAddress(item, 'pickup')}
                                    className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors border-b border-stone-50 last:border-0"
                                  >
                                    {item.description}
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>

                          {bookingData.serviceType === 'transfer' && (
                            <>
                              {/* Separator Line with Swap Button */}
                              <div className="h-px bg-stone-100 mx-12 relative">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setBookingData(prev => ({
                                      ...prev,
                                      pickup: prev.dropoff,
                                      dropoff: prev.pickup,
                                      pickupCoords: prev.dropoffCoords,
                                      dropoffCoords: prev.pickupCoords
                                    }));
                                  }}
                                  className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 shadow-md hover:shadow-lg transition-all z-30"
                                  title={t('swap_addresses')}
                                >
                                  <iconify-icon icon="solar:transfer-vertical-linear" width="16"></iconify-icon>
                                </button>
                              </div>

                              {/* Dropoff Field */}
                              <motion.div layout className={`relative ${suggestions.dropoff.length > 0 ? 'z-40' : 'z-10'}`}>
                                <div className="relative">
                                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-800" size={18} />
                                  <input 
                                    ref={dropoffInputRef}
                                    type="text" 
                                    value={bookingData.dropoff}
                                    onChange={(e) => {
                                      setBookingData(prev => ({ ...prev, dropoff: e.target.value, dropoffCoords: null }));
                                      searchAddress(e.target.value, 'dropoff');
                                      if (bookingError) setBookingError(null);
                                    }}
                                    placeholder={t('dropoff_placeholder')} 
                                    className="w-full bg-transparent border-none py-4 md:py-5 pl-12 pr-4 text-stone-950 text-[16px] font-medium placeholder:text-stone-700/90 focus:ring-0 outline-none transition-all"
                                  />
                                </div>
                                {suggestions.dropoff.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-stone-300 rounded-xl overflow-hidden shadow-xl top-full">
                                    {suggestions.dropoff.map((item, i) => (
                                      <button 
                                        key={i}
                                        type="button"
                                        onClick={() => selectAddress(item, 'dropoff')}
                                        className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors border-b border-stone-50 last:border-0"
                                      >
                                        {item.description}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            </>
                          )}

                          {bookingData.serviceType === 'hourly' && (
                            <>
                              <div className="h-px bg-stone-100 mx-12"></div>
                              <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-800" size={18} />
                                <select 
                                  value={bookingData.durationHours}
                                  onChange={(e) => setBookingData(prev => ({ ...prev, durationHours: parseInt(e.target.value) }))}
                                  className="w-full bg-transparent border-none py-4 md:py-5 pl-12 pr-4 text-stone-950 text-[15px] font-semibold focus:ring-0 outline-none appearance-none cursor-pointer"
                                >
                                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                                    <option key={h} value={h} className="text-stone-950 bg-white font-medium">{h} {t('hours_count')}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-880">
                                  <ChevronDown size={18} />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Unified Date & Time Field */}
                      <div className="space-y-2 relative flex flex-col">
                        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">
                          {lang === 'fr' ? 'Date & Heure' : 'Date & Time'}
                        </label>
                        <div className="flex flex-col md:flex-row border border-stone-300 rounded-xl bg-white overflow-hidden divide-y md:divide-y-0 md:divide-x divide-stone-200">
                          {/* Date Selector */}
                          <div className="relative flex items-center md:flex-1">
                            <Calendar size={18} className="absolute left-4 text-stone-800 pointer-events-none" />
                            <input
                              type={bookingData.date ? "date" : "text"}
                              placeholder={lang === 'fr' ? 'Choisir une date' : 'Select a date'}
                              onFocus={(e) => (e.target.type = "date")}
                              onBlur={(e) => {
                                if (!bookingData.date) e.target.type = "text";
                              }}
                              value={bookingData.date}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                setBookingData(prev => ({ ...prev, date: e.target.value }));
                                if (bookingError) setBookingError(null);
                              }}
                              required
                              className={`w-full bg-transparent border-none py-4 md:py-5 pl-12 pr-4 font-medium placeholder:text-stone-700/90 focus:ring-0 outline-none cursor-pointer text-[16px] appearance-none ${bookingData.date ? 'text-stone-950' : 'text-stone-700/90'}`}
                            />
                          </div>
                          {/* Time Selector */}
                          <div className="relative flex items-center md:flex-1">
                            <Clock size={18} className="absolute left-4 text-stone-800 pointer-events-none" />
                            <select 
                              value={bookingData.time}
                              onChange={(e) => {
                                setBookingData(prev => ({ ...prev, time: e.target.value }));
                                if (bookingError) setBookingError(null);
                              }}
                              className={`w-full bg-transparent border-none py-4 md:py-5 pl-12 pr-10 font-medium focus:ring-0 outline-none appearance-none cursor-pointer text-[16px] ${bookingData.time ? 'text-stone-950' : 'text-stone-700/90'}`}
                            >
                              <option value="" disabled className="text-stone-700/90 bg-white font-medium">
                                {lang === 'fr' ? 'Choisir un créneau' : 'Select a time'}
                              </option>
                              {timeSlots.map(slot => (
                                <option key={slot} value={slot} className="text-stone-950 bg-white font-medium">{slot}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-800">
                              <ChevronDown size={18} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button 
                          onClick={() => setBookingData(prev => ({ 
                            ...prev, 
                            isReturnTrip: !prev.isReturnTrip
                          }))}
                          className={`w-full flex items-center justify-between p-2.5 md:p-3.5 rounded-xl border-2 transition-all ${bookingData.isReturnTrip ? 'border-stone-900 bg-stone-50' : 'border-stone-100 bg-white hover:border-stone-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bookingData.isReturnTrip ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                              <iconify-icon icon="solar:refresh-linear" width="20"></iconify-icon>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-bold text-stone-900">{t('returnTrip')}</div>
                              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">{t('add_return')}</div>
                            </div>
                          </div>
                          <div className={`w-12 h-6 rounded-full relative transition-all ${bookingData.isReturnTrip ? 'bg-stone-900' : 'bg-stone-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${bookingData.isReturnTrip ? 'left-7' : 'left-1'}`}></div>
                          </div>
                        </button>

                        {bookingData.isReturnTrip && (
                          <div className="space-y-2 relative flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">
                              {lang === 'fr' ? 'Date & Heure de retour' : 'Return Date & Time'}
                            </label>
                            <div className="flex flex-col md:flex-row border border-stone-300 rounded-xl bg-white overflow-hidden divide-y md:divide-y-0 md:divide-x divide-stone-200">
                              {/* Return Date Selector */}
                              <div className="relative flex items-center md:flex-1">
                                <Calendar size={18} className="absolute left-4 text-stone-800 pointer-events-none" />
                                <input
                                  type={bookingData.returnDate ? "date" : "text"}
                                  placeholder={lang === 'fr' ? 'Choisir une date de retour' : 'Select a return date'}
                                  onFocus={(e) => (e.target.type = "date")}
                                  onBlur={(e) => {
                                    if (!bookingData.returnDate) e.target.type = "text";
                                  }}
                                  value={bookingData.returnDate}
                                  min={bookingData.date || new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    setBookingData(prev => ({ ...prev, returnDate: e.target.value }));
                                    if (bookingError) setBookingError(null);
                                  }}
                                  required={bookingData.isReturnTrip}
                                  className={`w-full bg-transparent border-none py-4 md:py-5 pl-12 pr-4 font-medium placeholder:text-stone-700/90 focus:ring-0 outline-none cursor-pointer text-[16px] appearance-none ${bookingData.returnDate ? 'text-stone-950' : 'text-stone-700/90'}`}
                                />
                              </div>
                              {/* Return Time Selector */}
                              <div className="relative flex items-center md:flex-1">
                                <Clock size={18} className="absolute left-4 text-stone-800 pointer-events-none" />
                                <select 
                                  value={bookingData.returnTime}
                                  onChange={(e) => {
                                    setBookingData(prev => ({ ...prev, returnTime: e.target.value }));
                                    if (bookingError) setBookingError(null);
                                  }}
                                  className={`w-full bg-transparent border-none py-4 md:py-5 pl-12 pr-10 font-medium focus:ring-0 outline-none appearance-none cursor-pointer text-[16px] ${bookingData.returnTime ? 'text-stone-950' : 'text-stone-700/90'}`}
                                >
                                  <option value="" disabled className="text-stone-700/90 bg-white font-medium">
                                    {lang === 'fr' ? 'Choisir un créneau de retour' : 'Select a return time'}
                                  </option>
                                  {timeSlots.map(slot => (
                                    <option key={slot} value={slot} className="text-stone-950 bg-white font-medium">{slot}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-800">
                                  <ChevronDown size={18} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={handleNextStep1}
                          disabled={loading}
                          className="w-full bg-stone-900 text-white py-[19px] md:py-[21px] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            <>
                              {t('view_prices')}
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Itinerary Preview */}
                  {step === 2 && (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 md:p-6 space-y-4">
                          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                             <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center">
                                <iconify-icon icon="solar:route-linear" width="22"></iconify-icon>
                             </div>
                             <div>
                               <div className="text-xs font-bold text-stone-900 uppercase tracking-widest">{t('itinerary_label')}</div>
                               <div className="text-[10px] text-stone-400 font-medium">{Math.round(bookingData.distance)} KM • {Math.round(bookingData.duration)} MIN</div>
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex gap-3">
                               <div className="w-0.5 h-full bg-stone-200 rounded-full shrink-0"></div>
                               <div className="space-y-2">
                                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('departure')}</div>
                                  <div className="text-sm text-stone-900 font-medium">{bookingData.pickup}</div>
                                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('arrival')}</div>
                                  <div className="text-sm text-stone-900 font-medium">{bookingData.dropoff}</div>
                               </div>
                             </div>
                          </div>

                          {bookingData.isReturnTrip && (
                            <div className="space-y-3 pt-4 border-t border-stone-100">
                               <div className="flex gap-3">
                                 <div className="w-0.5 h-full bg-stone-200 rounded-full shrink-0"></div>
                                 <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('itinerary_return')}</div>
                                    <div className="text-sm text-stone-900 font-medium">{bookingData.returnPickup} → {bookingData.returnDropoff}</div>
                                 </div>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setStep(1)}
                          className="w-14 h-12 md:h-14 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center hover:bg-stone-200 transition-all shrink-0"
                          title={t('back')}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button 
                          onClick={() => setStep(3)}
                          className="flex-1 bg-stone-900 text-white py-3 md:py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 flex items-center justify-center gap-2"
                        >
                          {t('next')}
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Vehicle */}
                   {step === 3 && (
                    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-full space-y-3 md:space-y-4">
                        {Object.entries(vehicles).map(([key, vehicle]) => (
                          <button 
                            key={key}
                            onClick={() => setBookingData(prev => ({ ...prev, vehicle: key }))}
                            className={`w-full flex items-center justify-between gap-4 md:gap-8 p-4 md:p-6 rounded-2xl border-2 transition-all ${bookingData.vehicle === key ? 'border-stone-900 bg-stone-50' : 'border-stone-100 bg-white hover:border-stone-200'}`}
                          >
                            <div className="w-24 md:w-32 h-16 md:h-20 bg-stone-100 rounded-xl flex items-center justify-center p-2 shrink-0">
                              <img src={vehicle.img} alt={vehicle.name} className="w-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-sm md:text-base font-bold text-stone-900 truncate">{t(`vehicle_${key}`)}</div>
                              <div className="text-[10px] md:text-xs text-stone-400 uppercase tracking-wider font-medium truncate">{vehicle.model}</div>
                              <div className="flex items-center gap-3 md:gap-4 mt-1 md:mt-2">
                                <span className="flex items-center gap-1 text-[10px] md:text-xs text-stone-500 font-medium whitespace-nowrap"><Users size={12} /> {vehicle.pax}</span>
                                <span className="flex items-center gap-1 text-[10px] md:text-xs text-stone-500 font-medium whitespace-nowrap"><Briefcase size={12} /> {vehicle.bag}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-lg md:text-xl font-bold text-stone-900">
                                {Math.round(vehicle.basePrice + (bookingData.distance > 10 ? (bookingData.distance - 10) * 2 : 0))}€
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3 pt-6 border-t border-stone-100">
                        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('extras_label')}</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(extras).map(([key, extra]) => (
                            <button 
                              key={key}
                              onClick={() => {
                                setBookingData(prev => ({
                                  ...prev,
                                  extras: prev.extras.includes(key) 
                                    ? prev.extras.filter(e => e !== key)
                                    : [...prev.extras, key]
                                }));
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all ${bookingData.extras.includes(key) ? 'border-stone-900 bg-stone-900 text-white shadow-sm' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'}`}
                            >
                              <div className={`flex items-center justify-center ${bookingData.extras.includes(key) ? 'text-white' : 'text-stone-400'}`}>
                                {bookingData.extras.includes(key) ? <Check size={10} strokeWidth={3} /> : <Plus size={10} />}
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-wider">{t(`extra_${key}`)}</span>
                              <span className={`text-[9px] font-medium ${bookingData.extras.includes(key) ? 'text-white/70' : 'text-stone-400'}`}>+{extra.price}€</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setStep(2)}
                          className="w-14 h-12 md:h-14 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center hover:bg-stone-200 transition-all shrink-0"
                          title={t('back')}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button 
                          onClick={() => setStep(4)}
                          className="flex-1 bg-stone-900 text-white py-3 md:py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 flex items-center justify-center gap-2"
                        >
                          {t('next')}
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Contact & Recap */}
                  {step === 4 && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('firstName')}</label>
                          <input 
                            ref={firstNameRef}
                            type="text" 
                            required
                            value={bookingData.firstName}
                            onChange={(e) => setBookingData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder={t('placeholder_firstName')}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-3 md:py-4 px-4 text-stone-950 font-medium placeholder:text-stone-700/95 outline-none focus:border-stone-900 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('lastName')}</label>
                          <input 
                            ref={lastNameRef}
                            type="text" 
                            required
                            value={bookingData.lastName}
                            onChange={(e) => setBookingData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder={t('placeholder_lastName')}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-3 md:py-4 px-4 text-stone-950 font-medium placeholder:text-stone-700/95 outline-none focus:border-stone-900 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('email')}</label>
                          <input 
                            ref={emailRef}
                            type="email" 
                            required
                            value={bookingData.email}
                            onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder={t('placeholder_email')}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-3 md:py-4 px-4 text-stone-950 font-medium placeholder:text-stone-700/95 outline-none focus:border-stone-900 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('phone')}</label>
                          <div className="flex bg-stone-50 border border-stone-300 rounded-xl focus-within:border-stone-900 focus-within:bg-white transition-all overflow-hidden">
                            <select
                              value={bookingData.countryCode}
                              onChange={(e) => setBookingData(prev => ({ ...prev, countryCode: e.target.value }))}
                              className="bg-transparent border-r border-stone-300 py-3 md:py-4 px-3 text-stone-950 outline-none text-sm font-semibold w-auto cursor-pointer flex-shrink-0"
                            >
                              <option value="+33" className="text-stone-950 bg-white font-medium">+33</option>
                              <option value="+44" className="text-stone-950 bg-white font-medium">+44</option>
                              <option value="+39" className="text-stone-950 bg-white font-medium">+39</option>
                              <option value="+49" className="text-stone-950 bg-white font-medium">+49</option>
                              <option value="+34" className="text-stone-950 bg-white font-medium">+34</option>
                              <option value="+41" className="text-stone-950 bg-white font-medium">+41</option>
                              <option value="+32" className="text-stone-950 bg-white font-medium">+32</option>
                              <option value="+31" className="text-stone-950 bg-white font-medium">+31</option>
                              <option value="+1" className="text-stone-950 bg-white font-medium">+1</option>
                              <option value="+971" className="text-stone-950 bg-white font-medium">+971</option>
                            </select>
                            <input 
                              ref={phoneRef}
                              type="tel" 
                              required
                              value={bookingData.phone}
                              onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder={t('placeholder_phone')}
                              className="w-full bg-transparent py-3 md:py-4 px-4 text-stone-950 font-medium placeholder:text-stone-700/95 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('passengers')}</label>
                          <select 
                            value={bookingData.passengers}
                            onChange={(e) => setBookingData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-3 md:py-4 px-4 text-stone-950 font-semibold outline-none focus:border-stone-900 focus:bg-white transition-all appearance-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                              <option key={n} value={n} className="text-stone-950 bg-white font-semibold">{n} {n > 1 ? t('passenger_plural') : t('passenger_singular')}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2 relative">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('luggage')}</label>
                          <select 
                            value={bookingData.luggage}
                            onChange={(e) => setBookingData(prev => ({ ...prev, luggage: parseInt(e.target.value) }))}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-3 md:py-4 px-4 text-stone-950 font-semibold outline-none focus:border-stone-900 focus:bg-white transition-all appearance-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                              <option key={n} value={n} className="text-stone-950 bg-white font-semibold">{n} {t('luggage_label')}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('flight')}</label>
                        <input 
                          type="text" 
                          value={bookingData.flightNumber}
                          onChange={(e) => setBookingData(prev => ({ ...prev, flightNumber: e.target.value }))}
                          placeholder={t('flight')}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl py-3 md:py-4 px-4 text-stone-950 font-medium placeholder:text-stone-700/95 outline-none focus:border-stone-900 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-4 pt-6 border-t border-stone-100">
                        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('payment_mode')}</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'card', name: t('card'), icon: CreditCard },
                            { id: 'cash', name: t('cash'), icon: Users }
                          ].map((method) => (
                            <button 
                              key={method.id}
                              onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: method.id }))}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${bookingData.paymentMethod === method.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 bg-white hover:border-stone-200'}`}
                            >
                              <method.icon size={20} className={bookingData.paymentMethod === method.id ? 'text-stone-900' : 'text-stone-400'} />
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${bookingData.paymentMethod === method.id ? 'text-stone-900' : 'text-stone-400'}`}>{method.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setStep(3)}
                          className="w-14 h-11 md:h-12 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center hover:bg-stone-200 transition-all shrink-0"
                          title={t('back')}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button 
                          onClick={handleBooking}
                          disabled={loading}
                          className="flex-1 bg-stone-900 text-white py-4 md:py-5 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                          {t('confirm')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Success */}
                  {step === 5 && (
                    <div className="py-8 md:py-12 text-center space-y-6 md:space-y-8 animate-in zoom-in duration-500">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-stone-900 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                        <Check size={40} className="text-white" strokeWidth={3} />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-3xl font-bold text-stone-900">{t('success')}</h3>
                        <p className="text-stone-500 leading-relaxed max-w-xs mx-auto">
                          {t('successMsg')}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setStep(1);
                          setBookingData({
                            serviceType: 'transfer',
                            serviceCategory: 'transfer',
                            durationHours: 2,
                            pickup: '',
                            dropoff: '',
                            pickupCoords: null,
                            dropoffCoords: null,
                            date: '',
                            time: '',
                            vehicle: 'business',
                            passengers: 1,
                            luggage: 1,
                            extras: [],
                            firstName: '',
                            lastName: '',
                            email: '',
                            countryCode: '+33',
                            phone: '',
                            flightNumber: '',
                            paymentMethod: 'card',
                            isReturnTrip: false,
                            returnPickup: '',
                            returnDropoff: '',
                            returnPickupCoords: null,
                            returnDropoffCoords: null,
                            returnDate: '',
                            returnTime: '',
                            distance: 0,
                            duration: 0
                          });
                          if (markersRef.current.pickup) markersRef.current.pickup.remove();
                          if (markersRef.current.dropoff) markersRef.current.dropoff.remove();
                          if (routeLineRef.current) routeLineRef.current.remove();
                        }}
                        className="bg-stone-100 text-stone-900 px-8 py-4 rounded-xl font-bold hover:bg-stone-200 transition-all"
                      >
                        {t('newReservation')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Side: Map & Dynamic Summary */}
                <div className={`col-span-full lg:col-span-5 bg-stone-50 ${step === 2 ? 'px-5 py-4 pb-4 md:p-10' : 'px-5 py-6 md:p-10'} flex flex-col transition-all duration-500 ${step === 1 || step === 5 ? 'hidden lg:flex' : 'flex'}`}>
                  
                  {/* Map Container - Consistent height across all steps */}
                  {step === 2 && (
                    <div className={`bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm relative h-[180px] md:h-[250px] ${step === 2 ? 'mb-0' : 'mb-4 md:mb-6'} animate-in fade-in duration-500 block`}>
                      <div ref={mapContainerRef} className="w-full h-full z-0" />
                      {bookingData.distance > 0 && (
                        <div className="absolute bottom-4 right-4 z-10">
                          <div className="bg-white border border-stone-200 rounded-lg p-2 px-3 text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-3 shadow-lg">
                            <span>{Math.round(bookingData.distance)} KM</span>
                            <div className="w-px h-3 bg-stone-200"></div>
                            <span>{Math.round(bookingData.duration)} MIN</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary - Visible from Step 1 with Dark Design */}
                  <div className={`flex-1 flex-col transition-all duration-500 overflow-hidden bg-stone-900 rounded-2xl p-4 md:p-6 border border-white/5 ${step >= 1 && step !== 2 && step < 5 ? 'opacity-100 translate-y-0 flex' : 'opacity-0 translate-y-10 pointer-events-none h-0 hidden'} ${step === 1 ? 'hidden md:flex' : ''}`}>
                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">{t('orderSummary')}</h3>
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex gap-3">
                        <div className="w-0.5 h-full bg-white/10 rounded-full shrink-0"></div>
                        <div className="space-y-3">
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('departure')}</div>
                            <div className="text-xs text-white/80 font-medium line-clamp-1">{bookingData.pickup || '—'}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{bookingData.serviceType === 'transfer' ? t('arrival') : t('duration_label')}</div>
                            <div className="text-xs text-white/80 font-medium line-clamp-1">
                              {bookingData.serviceType === 'transfer' ? (bookingData.dropoff || '—') : `${bookingData.durationHours} ${t('hours_count')}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('date') || 'Date'}</div>
                          <div className="text-xs text-white/80 font-medium">{bookingData.date || '—'}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('field_time')}</div>
                          <div className="text-xs text-white/80 font-medium">{bookingData.time || '—'}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{step < 3 ? (bookingData.serviceType === 'transfer' ? 'Distance' : t('duration_label')) : t('step3')}</div>
                          <div className="text-xs text-white/80 font-medium">
                            {step < 3 
                              ? (bookingData.serviceType === 'transfer' ? `${Math.round(bookingData.distance)} KM` : `${bookingData.durationHours} ${t('hours_count')}`) 
                              : t(`vehicle_${bookingData.vehicle}`)}
                          </div>
                        </div>
                        {step >= 3 && bookingData.extras.length > 0 && (
                          <div className="col-span-2 space-y-0.5">
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('extras_label')}</div>
                            <div className="text-xs text-white/80 font-medium">
                              {bookingData.extras.map(e => t(`extra_${e}`)).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5">
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('total')}</div>
                          <div className="text-3xl font-bold text-white">{step < 3 ? '...' : `${totalPrice}€`}</div>
                        </div>
                        <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1">{t('vatIncluded')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ with custom smooth accordion */}
        <section 
          id="faq" 
          className="bg-stone-925 w-full py-32 px-6 border-t border-white/5 relative overflow-hidden"
        >
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[3] = el; }}
            className="max-w-3xl mx-auto reveal relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center mb-20 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Info size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">FAQ</span>
              </div>
              <h2 className="text-[38px] md:text-4xl lg:text-5xl font-bold tracking-[0.02em] uppercase text-white drop-shadow-sm leading-[1.25] md:leading-snug">{t('faq_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
            </motion.div>
            <div className="flex flex-col">
              {[
                { q: t('q1'), a: t('a1') },
                { q: t('q2'), a: t('a2') },
                { q: t('q3'), a: t('a3') },
                { q: t('q4'), a: t('a4') },
                { q: t('q5'), a: t('a5') },
                { q: t('q6'), a: t('a6') }
              ].map((faq, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`faq-item w-full border-b border-white/15 last:border-b-0 group ${openFaqIndex === i ? 'open' : ''}`}
                >
                  <button 
                    onClick={() => toggleFaq(i)}
                    className="w-full py-6 flex justify-between items-center text-base md:text-lg font-normal text-white hover:text-stone-300 transition-colors text-left" 
                    aria-expanded={openFaqIndex === i}
                  >
                    {faq.q}
                    <iconify-icon icon="solar:alt-arrow-down-linear" width="20" className="text-stone-500 faq-icon" style={{ strokeWidth: 1.5 }}></iconify-icon>
                  </button>
                  <div className="faq-content">
                    <div className="pb-6 text-[14.5px] text-stone-300/90 font-normal leading-relaxed tracking-wide">
                      {faq.a}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="bg-stone-950 pt-24 pb-12 border-t border-white/5 w-full">
          <div className="max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
            <div className="flex flex-col items-center mb-10">
              <div className="flex items-end gap-1 mb-2 h-6 opacity-70">
                <div className="w-1 h-5 bg-white rounded-t-sm"></div>
                <div className="w-1 h-3 bg-white/60 rounded-t-sm"></div>
                <div className="w-1 h-6 bg-white rounded-t-sm"></div>
                <div className="w-1 h-4 bg-white/60 rounded-t-sm"></div>
                <div className="w-1 h-5 bg-white rounded-t-sm"></div>
              </div>
              <h1 className="text-[19px] font-medium tracking-[0.25em] uppercase text-white/70 mb-5">Safeness transport</h1>
              <p className="text-[13.5px] md:text-[15px] font-normal text-white/45 tracking-wide max-w-lg">
                {t('footer_desc')}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-x-12 gap-y-6 md:gap-y-5 mb-16 text-[13px] font-normal tracking-[0.15em] uppercase text-white/60 md:text-white/50">
              <a href="#services" className="hover:text-white transition-colors">{t('nav_services')}</a>
              <a href="#fleet" className="hover:text-white transition-colors">{t('nav_fleet')}</a>
              <a href="#gallery" className="hover:text-white transition-colors">{t('nav_gallery')}</a>
              <a href="#business" className="hover:text-white transition-colors">{t('nav_business')}</a>
              <a href="#booking" className="hover:text-white transition-colors">{t('nav_booking')}</a>
            </div>
            
            <div className="w-full h-px bg-white/5 mb-14 relative flex items-center justify-center">
              <div className="px-6 bg-stone-950 flex gap-4 absolute">
                <a href="mailto:safeness.transport@yahoo.com" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all bg-stone-950">
                  <iconify-icon icon="solar:letter-linear" width="20" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </a>
                <a href="tel:+33782274920" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all bg-stone-950">
                  <iconify-icon icon="solar:phone-calling-linear" width="20" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </a>
                <a href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all bg-stone-950">
                  <iconify-icon icon="solar:map-point-linear" width="20" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </a>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between w-full text-[11px] md:text-[13px] text-white/30 uppercase tracking-[0.2em] mt-8 gap-4 text-center font-normal">
              <p>Safeness transport © 2026. All Rights Reserved.</p>
              <div className="flex gap-8">
                <a href="#" className="hover:text-white/60 transition-colors">{t('legal')}</a>
                <a href="#" className="hover:text-white/60 transition-colors">{t('privacy')}</a>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* WHATSAPP & SCROLL TOP FLOTTANT */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div 
          className={`bg-white border border-stone-200 text-stone-900 px-3 py-1.5 rounded-full shadow-2xl text-[9px] font-bold tracking-tight transition-all duration-500 origin-bottom-right flex items-center gap-2 relative mb-1 ${isChatTooltipVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90 pointer-events-none'}`}
          id="chat-tooltip"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          {t('whatsapp_tooltip')}
          {/* Bubble Tail */}
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white border-r border-b border-stone-200 rotate-45"></div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`w-14 h-14 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all ${showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'}`}
            title="Scroll to Top"
          >
            <iconify-icon icon="solar:alt-arrow-up-linear" width="22" style={{ strokeWidth: 1.5 }}></iconify-icon>
          </button>
          <a 
            href="https://wa.me/33782274920" 
            target="_blank"
            rel="noreferrer"
            className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,211,102,0.3)] text-white hover:scale-110 transition-transform"
          >
            <iconify-icon icon="ic:baseline-whatsapp" width="28"></iconify-icon>
          </a>
        </div>
      </div>
    </>
  );
}
