/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useMemo, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stripe, loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the public key from environment
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

if (!STRIPE_PUBLIC_KEY) {
  console.error("Stripe Public Key is missing! Check your .env or Vercel environment variables.");
} else {
  console.log("Stripe Public Key detected on Client: YES");
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
import L from 'leaflet';
import { 
  MapPin, Navigation, Calendar, Clock, Users, Briefcase, Building2,
  ChevronRight, ChevronLeft, Check, CreditCard, Plane, Tag, Sparkles, Palette,
  Train, Info, ShieldCheck, Star, ArrowRight, ArrowLeft, X, Menu, Plus,
  Phone, Mail, MessageSquare, Globe, Search, Loader2,
  Instagram, Linkedin
} from 'lucide-react';

// Extend JSX namespace for iconify-icon
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': any;
    }
  }
}

const cities = [
  { name: 'London', icon: 'circle-flags:gb' },
  { name: 'Paris', icon: 'circle-flags:fr' },
  { name: 'Milan', icon: 'circle-flags:it' },
  { name: 'Berlin', icon: 'circle-flags:de' }
];

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [isCityTransitioning, setIsCityTransitioning] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<number | null>(null);
  const [isChatTooltipVisible, setIsChatTooltipVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle Stripe Redirection Status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      setStep(4);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'cancel') {
      setStep(3);
      setBookingError("Le paiement a été annulé. Vous pouvez réessayer.");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
    const timer = setInterval(nextCity, 2500);
    return () => clearInterval(timer);
  }, [nextCity]);

  const [openWhyIndex, setOpenWhyIndex] = useState<number | null>(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);

  // Booking Form State
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    pickup: '',
    dropoff: '',
    pickupCoords: null as [number, number] | null,
    dropoffCoords: null as [number, number] | null,
    time: '12:00 - 12:15',
    vehicle: 'business',
    passengers: 1,
    luggage: 1,
    extras: [] as string[],
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    flightNumber: '',
    paymentMethod: 'card',
    isReturnTrip: false,
    returnTime: '12:00 - 12:15',
    distance: 0,
    duration: 0
  });

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const start = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        let endHour = hour;
        let endMin = min + 15;
        if (endMin === 60) {
          endMin = 0;
          endHour++;
        }
        const end = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        slots.push(`${start} - ${end}`);
      }
    }
    return slots;
  }, []);

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{
    pickup: any[];
    dropoff: any[];
  }>({ pickup: [], dropoff: [] });

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ pickup: L.Marker | null; dropoff: L.Marker | null }>({ pickup: null, dropoff: null });
  const routeLineRef = useRef<L.Layer | null>(null);

  const revealRefs = useRef<(HTMLDivElement | HTMLElement)[]>([]);
  const servicesScrollRef = useRef<HTMLDivElement>(null);

  const scrollServices = (direction: 'next' | 'prev') => {
    if (!servicesScrollRef.current) return;
    const container = servicesScrollRef.current;
    const card = container.querySelector('div') as HTMLElement;
    if (!card) return;
    
    const cardWidth = card.offsetWidth;
    const gap = 24; // gap-6 is 24px
    const scrollAmount = cardWidth + gap;
    
    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
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
    const { pickup, dropoff } = bookingData;
    
    setLoading(true);
    setBookingError(null);
    try {
      let pCoords = bookingData.pickupCoords;
      let dCoords = bookingData.dropoffCoords;

      const geocode = async (query: string) => {
        if (!query.trim()) return null;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=1`);
          const data = await res.json();
          return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number] : null;
        } catch (e) {
          return null;
        }
      };

      if (!pCoords && pickup.trim()) {
        pCoords = await geocode(pickup);
        if (pCoords) setBookingData(prev => ({ ...prev, pickupCoords: pCoords }));
      }
      
      if (!dCoords && dropoff.trim()) {
        dCoords = await geocode(dropoff);
        if (dCoords) setBookingData(prev => ({ ...prev, dropoffCoords: dCoords }));
      }

      if (pCoords && dCoords) {
        await calculateRoute(pCoords, dCoords);
      }
      
      // Always proceed to next step
      setStep(2);
    } catch (error) {
      console.error("Step 1 error:", error);
      // Still proceed even on error
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const vehicles = {
    business: { name: 'Business Class', model: 'Mercedes Classe E', basePrice: 80, pax: 3, bag: 3, img: 'https://mcslimo.fr/wp-content/uploads/2023/04/eclass.png' },
    van: { name: 'Business Van', model: 'Mercedes Classe V', basePrice: 120, pax: 7, bag: 7, img: 'https://mcslimo.fr/wp-content/uploads/2023/04/vclass.png' },
    first: { name: 'First Class', model: 'Mercedes Classe S', basePrice: 160, pax: 3, bag: 3, img: 'https://mcslimo.fr/wp-content/uploads/2023/04/sclass.png' }
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
      step2: 'Véhicule',
      step3: 'Contact',
      pickup: 'Lieu de départ',
      dropoff: 'Lieu d\'arrivée',
      date: 'Date',
      time: 'Heure',
      next: 'Suivant',
      back: 'Retour',
      confirm: 'Confirmer la réservation',
      summary: 'Récapitulatif',
      total: 'Total estimé',
      passengers: 'Passagers',
      luggage: 'Bagages',
      payment: 'Mode de paiement',
      card: 'Carte Bancaire (à bord)',
      cash: 'Espèces (à bord)',
      transfer: 'Virement (avance)',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      flight: 'N° de vol / train (optionnel)',
      returnTrip: 'Trajet Retour',
      returnDate: 'Date Retour',
      returnTime: 'Heure Retour',
      success: 'Demande envoyée !',
      successMsg: 'Votre demande de réservation a été transmise. Un conseiller vous contactera par SMS ou Email pour confirmer la disponibilité.',
      depositNotice: 'Un acompte de 20 € est requis pour valider la réservation. Le reste sera à régler à bord',
      newReservation: 'Nouvelle réservation',
      orderSummary: 'Récapitulatif de commande',
      departure: 'Départ',
      arrival: 'Arrivée',
      dateTime: 'Date & Heure',
      vatIncluded: 'TVA incluse',
      pickup_label: 'Lieu de prise en charge',
      pickup_placeholder: 'Adresse, Aéroport, Gare...',
      dropoff_label: 'Destination',
      dropoff_placeholder: 'Où allez-vous ?',
      nav_services: 'Services',
      nav_fleet: 'La Flotte',
      nav_gallery: 'Galerie',
      nav_business: 'Business',
      nav_contact: 'Contact',
      nav_booking: 'Réservation',
      hero_badge: 'Transport Exécutif, Flotte d\'Élite & Itinéraires Sur Mesure',
      hero_luxura: 'Safeness',
      hero_worldwide: 'Worldwide',
      hero_book: 'RÉSERVER UN VÉHICULE',
      hero_estimate: 'DEMANDER UN DEVIS PERSONNALISÉ',
      europe_tag: 'Europe',
      europe_title: 'Une présence',
      europe_subtitle: 'Européenne',
      europe_desc: '"Bien que notre centre d\'opérations soit situé à Paris, nous assurons vos liaisons longue distance vers les principales métropoles européennes."',
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
      services_desc: 'EXCLUSIVE',
      service1_title: 'Transferts Privés',
      service1_desc: 'Liaisons aéroports, gares et trajets urbains avec une ponctualité absolue.',
      service2_title: 'Mise à Disposition',
      service2_desc: 'Un chauffeur dédié pour vos rendez-vous d\'affaires ou événements privés.',
      service3_title: 'Accueil VIP',
      service3_desc: 'Accompagnement personnalisé dès la sortie de l\'avion pour une transition fluide.',
      service4_title: 'Événementiel',
      service4_desc: 'Logistique de transport pour vos mariages, galas et lancements de produits.',
      service5_title: 'Roadshow Business',
      service5_desc: 'Optimisation de vos déplacements professionnels complexes sur plusieurs jours.',
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
      corp_subtitle: 'Des solutions dédiées aux professionnels',
      corp_desc: 'Safeness & Transferts propose des comptes corporate sur-mesure pour les entreprises, les hôtels de luxe et les agences événementielles. Optimisez la gestion des déplacements de vos collaborateurs et de vos clients VIP avec un partenaire fiable.',
      corp_li1: 'Facturation simplifiée et relevés mensuels détaillés.',
      corp_li2: 'Priorité sur les réservations et support client dédié 24/7.',
      corp_li3: 'Coordination complète pour vos roadshows et grands événements.',
      corp_cta: 'Ouvrir un compte professionnel',
      contact_pro: 'Contact Pro',
      field_name: 'Nom Complet',
      field_company: 'Société',
      field_message: 'Message',
      placeholder_name: 'Jean Dupont',
      placeholder_company: 'Entreprise S.A.',
      placeholder_email: 'jean@entreprise.com',
      placeholder_message: 'Décrivez votre besoin...',
      contact_btn: 'Demander une Ouverture de Compte',
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
      reviews_tag: 'Reviews',
      reviews_title: 'L\'avis de nos clients',
      transfers_tag: 'Tarifs',
      transfers_title: 'Transferts Populaires',
      transfers_desc: 'Nos itinéraires les plus demandés avec des tarifs fixes et transparents.',
      route_cdg: 'Paris ↔ Aéroport CDG',
      route_orly: 'Paris ↔ Aéroport Orly',
      route_beauvais: 'Paris ↔ Aéroport Beauvais',
      route_disney: 'Paris ↔ Disneyland Paris',
      route_versailles: 'Paris ↔ Château de Versailles',
      route_giverny: 'Paris ↔ Giverny (Jardins de Monet)',
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
      footer_desc: "L'élite du transport : prestige mondial, excellence sans compromis",
      legal: 'Mentions légales',
      privacy: 'Mentions légales',
      whatsapp_tooltip: 'Réserver par WhatsApp',
      lang_fr: 'Français',
      lang_en: 'Anglais',
      rev1_text: '"Service impeccable pour mon transfert vers Orly. Le chauffeur était en avance, le véhicule (Classe S) d\'une propreté absolue. Conduite très douce. Je recommande vivement Safeness & Transferts."',
      rev2_text: '"Nous avons réservé un Van pour nous rendre à Disneyland depuis Paris intra-muros avec les enfants. Voyage spacieux, bouteilles d\'eau à disposition, service très courtois."',
      rev3_text: '"Utilisé pour un déplacement professionnel de Paris vers Milan. Un trajet longue distance qui s\'est déroulé dans un confort parfait. Mon bureau mobile le temps d\'une journée."',
      rev4_text: '"Une expérience de luxe du début à la fin. L\'accueil VIP à l\'aéroport CDG a rendu mon arrivée à Paris totalement sans stress. Je ne voyagerai plus autrement."',
      rev5_text: '"Chauffeur extrêmement professionnel et discret. La Classe E était parfaite pour mes rendez-vous d\'affaires toute la journée. Un service 5 étoiles."',
      rev6_text: '"Ponctualité et discrétion. Le service de conciergerie à bord est un vrai plus. Je recommande Safeness & Transferts pour tous vos déplacements d\'affaires à Paris."',
      why_tag: 'About Us',
      why_title: 'Pourquoi nous choisir',
      why_item1_title: '10+ ans d\'Expertise',
      why_item1_desc: 'Fort de plus d\'une décennie d\'excellence dans le transport de luxe international, Safeness & Transferts a perfectionné l\'art du voyage sur mesure. Nous maîtrisons chaque aspect logistique et chaque itinéraire européen pour vous garantir une ponctualité absolue, une sécurité rigoureuse et une sérénité totale lors de tous vos déplacements.',
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
      step2: 'Vehicle',
      step3: 'Contact',
      pickup: 'Pickup Location',
      dropoff: 'Drop-off Location',
      date: 'Date',
      time: 'Time',
      next: 'Next',
      back: 'Back',
      confirm: 'Confirm Booking',
      summary: 'Summary',
      total: 'Estimated Total',
      passengers: 'Passengers',
      luggage: 'Luggage',
      payment: 'Payment Method',
      card: 'Credit Card (on board)',
      cash: 'Cash (on board)',
      transfer: 'Bank Transfer (advance)',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      flight: 'Flight / Train No. (optional)',
      returnTrip: 'Return Trip',
      returnDate: 'Return Date',
      returnTime: 'Return Time',
      success: 'Request Sent!',
      successMsg: 'Your booking request has been transmitted. A consultant will contact you via SMS or Email to confirm availability.',
      depositNotice: 'A deposit of €20 is required to validate the booking. The balance will be paid on board',
      newReservation: 'New booking',
      orderSummary: 'Order Summary',
      departure: 'Departure',
      arrival: 'Arrival',
      dateTime: 'Date & Time',
      vatIncluded: 'VAT included',
      pickup_label: 'Pickup location',
      pickup_placeholder: 'Address, Airport, Station...',
      dropoff_label: 'Destination',
      dropoff_placeholder: 'Where are you going?',
      nav_services: 'Services',
      nav_fleet: 'Fleet',
      nav_gallery: 'Gallery',
      nav_business: 'Business',
      nav_contact: 'Contact',
      nav_booking: 'Booking',
      hero_badge: 'Executive Transport, Elite Fleet & Bespoke Itineraries',
      hero_luxura: 'Safeness',
      hero_worldwide: 'Worldwide',
      hero_book: 'BOOK A VEHICLE',
      hero_estimate: 'REQUEST CUSTOM ESTIMATE',
      europe_tag: 'Europe',
      europe_title: 'European',
      europe_subtitle: 'Presence',
      europe_desc: '"While our operations center is in Paris, we provide long-distance connections to major European metropolises."',
      europe_hub_tag: 'Main Hub',
      europe_hub_title: 'Central Paris',
      europe_hub_desc: 'The heart of our network. Elite chauffeurs available 24/7 for local needs and international transfers.',
      europe_munich_tag: 'Bavarian Business Hub',
      europe_milan_tag: 'Italian Design Hub',
      europe_berlin_tag: 'European Tech Hub',
      europe_connect_title: 'Europe Connect',
      europe_connect_desc: 'Daily links to Amsterdam, Brussels, and major French regional cities.',
      services_tag: 'Exclusive Services',
      services_title: 'Our Services',
      services_desc: 'EXCLUSIVE',
      service1_title: 'Private Transfers',
      service1_desc: 'Airport, station and city trips with absolute punctuality.',
      service2_title: 'Chauffeur Service',
      service2_desc: 'A dedicated chauffeur for your business meetings or private events.',
      service3_title: 'VIP Welcome',
      service3_desc: 'Personalized support from the moment you leave the plane for a fluid transition.',
      service4_title: 'Event Services',
      service4_desc: 'Transport logistics for your weddings, galas and product launches.',
      service5_title: 'Business Roadshow',
      service5_desc: 'Optimization of your complex professional travels over several days.',
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
      corp_subtitle: 'Dedicated solutions for professionals',
      corp_desc: 'Safeness & Transferts offers bespoke corporate accounts for companies, luxury hotels and event agencies. Optimize the management of your employees and VIP clients travels with a reliable partner.',
      corp_li1: 'Simplified billing and detailed monthly statements.',
      corp_li2: 'Priority on bookings and dedicated 24/7 client support.',
      corp_li3: 'Complete coordination for your roadshows and major events.',
      corp_cta: 'Open a business account',
      contact_pro: 'Contact Pro',
      field_name: 'Full Name',
      field_company: 'Company',
      field_message: 'Message',
      placeholder_name: 'John Doe',
      placeholder_company: 'Company Inc.',
      placeholder_email: 'john@company.com',
      placeholder_message: 'Describe your need...',
      contact_btn: 'Request an Account Opening',
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
      reviews_tag: 'Reviews',
      reviews_title: 'Customer Feedback',
      transfers_tag: 'Rates',
      transfers_title: 'Popular Transfers',
      transfers_desc: 'Our most requested routes with fixed and transparent pricing.',
      route_cdg: 'Paris ↔ CDG Airport',
      route_orly: 'Paris ↔ Orly Airport',
      route_beauvais: 'Paris ↔ Beauvais Airport',
      route_disney: 'Paris ↔ Disneyland Paris',
      route_versailles: 'Paris ↔ Palace of Versailles',
      route_giverny: 'Paris ↔ Giverny (Monet\'s Garden)',
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
      footer_desc: 'Elite transport: global prestige, uncompromising excellence',
      legal: 'Legal notice',
      privacy: 'Privacy Policy',
      whatsapp_tooltip: 'Book on WhatsApp',
      lang_fr: 'French',
      lang_en: 'English',
      rev1_text: '"Impeccable service for my transfer to Orly. The driver was early, the vehicle (S-Class) was absolutely clean. Very smooth driving. I highly recommend Safeness & Transferts."',
      rev2_text: '"We booked a Van to go to Disneyland from central Paris with the children. Spacious journey, water bottles available, very courteous service."',
      rev3_text: '"Used for a business trip from Paris to Milan. A long-distance journey that took place in perfect comfort. My mobile office for a day."',
      rev4_text: '"A luxury experience from start to finish. The VIP welcome at CDG airport made my arrival in Paris totally stress-free. I won\'t travel any other way."',
      rev5_text: '"Extremely professional and discreet driver. The E-Class was perfect for my business meetings all day. A 5-star service."',
      rev6_text: '"Punctuality and discretion. The on-board concierge service is a real plus. I recommend Safeness & Transferts for all your business travels in Paris."',
      why_tag: 'About Us',
      why_title: 'Why Choose Us',
      why_item1_title: '10+ Years of Expertise',
      why_item1_desc: 'With over a decade of excellence in international luxury transport, Safeness & Transferts has perfected the art of tailor-made travel. We master every logistical aspect and every European route to guarantee you absolute punctuality, rigorous security, and total serenity during all your journeys, regardless of their complexity.',
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

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([48.8566, 2.3522], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);
    }
  }, []);

  // Invalidate map size when step changes (for layout transitions)
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 600);
    }
  }, [step]);

  const searchAddress = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=5`);
      const data = await response.json();
      setSuggestions(prev => ({ ...prev, [type]: data }));
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectAddress = (item: any, type: 'pickup' | 'dropoff') => {
    const coords: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
    setBookingData(prev => ({
      ...prev,
      [type]: item.display_name,
      [`${type}Coords`]: coords
    }));
    setSuggestions(prev => ({ ...prev, [type]: [] }));

    if (mapRef.current) {
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
    let price = vehicle.basePrice;
    
    // Distance pricing (simplified: base + 2€/km after 10km)
    if (bookingData.distance > 10) {
      price += (bookingData.distance - 10) * 2;
    }

    // Extras
    bookingData.extras.forEach(extraKey => {
      price += (extras as any)[extraKey].price;
    });

    // Night/Weekend surcharge (mock logic)
    const hour = parseInt(bookingData.time.split(':')[0]);
    if (hour >= 21 || hour <= 6) price *= 1.2;

    // Return trip multiplier
    if (bookingData.isReturnTrip) price *= 2;

    return Math.round(price);
  }, [bookingData.vehicle, bookingData.distance, bookingData.extras, bookingData.time]);

  const handleBooking = async () => {
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
            vehicle: bookingData.vehicle,
            distance: bookingData.distance,
            extras: bookingData.extras,
            time: bookingData.time,
            isReturnTrip: bookingData.isReturnTrip,
            pickup: bookingData.pickup,
            dropoff: bookingData.dropoff,
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
      setStep(4);
      setLoading(false);
    }
  };

  const reviews = [
    { name: 'Marc J.', initial: 'MJ', text: t('rev1_text') },
    { name: 'Sophie L.', initial: 'SL', text: t('rev2_text') },
    { name: 'Antoine D.', initial: 'AD', text: t('rev3_text') },
    { name: 'Elena R.', initial: 'ER', text: t('rev4_text') },
    { name: 'Thomas B.', initial: 'TB', text: t('rev5_text') },
    { name: 'Julie M.', initial: 'JM', text: t('rev6_text') }
  ];

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
          <h1 className="text-[15px] md:text-lg font-normal tracking-[0.18em] md:tracking-[0.25em] uppercase text-white/90 whitespace-nowrap">Safeness & Transferts</h1>
          <p className="text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.15em] text-white/50 uppercase mt-0.5 whitespace-nowrap">Global Chauffeur Network</p>
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
            className={`absolute right-0 mt-3 w-40 bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 z-50 ${isLangMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
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
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 text-xs font-normal tracking-wide text-white/80 mb-10 max-w-2xl shadow-xl uppercase">
          {t('hero_badge')}
        </div>
        <div className="flex flex-col items-center mb-12">
          <div className="relative inline-block pb-1 mb-1">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight uppercase text-white drop-shadow-sm">{t('hero_luxura')}</h2>
            <div className="absolute bottom-0 left-[15%] right-[15%] h-px bg-zinc-300 rounded-full opacity-80"></div>
          </div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight uppercase text-white drop-shadow-sm mt-1">{t('hero_worldwide')}</h2>
        </div>
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
            className="absolute -right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white text-stone-950 rounded-full flex items-center justify-center shadow-xl hover:bg-stone-200 transition-colors z-20" 
            aria-label="Next Location"
          >
            <iconify-icon icon="solar:alt-arrow-right-linear" width="24" style={{ strokeWidth: 1.5 }}></iconify-icon>
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
            <p className="text-xs font-normal text-white/30 tracking-[0.2em] mb-12 uppercase">Corporate Partners</p>
            
            {/* Infinite Marquee */}
            <div className="relative flex overflow-hidden w-full">
              <div className="animate-marquee flex whitespace-nowrap w-max">
                <div className="flex items-center gap-12 md:gap-24 px-6 md:px-12 flex-none">
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Uniformation</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Prada</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Vaisala</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">ETS Global</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">LVMH</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Cartier</span>
                </div>
                <div className="flex items-center gap-12 md:gap-24 px-6 md:px-12 flex-none">
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Uniformation</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Prada</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Vaisala</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">ETS Global</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">LVMH</span>
                  <span className="text-xl md:text-2xl font-medium tracking-tighter text-stone-400 uppercase">Cartier</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COUVERTURE EUROPE - REDESIGNED BENTO GRID */}
        <section 
          id="europe"
          className="bg-stone-900 w-full py-16 px-6 border-t border-white/5 relative overflow-x-hidden md:overflow-hidden"
        >
          {/* Decorative background elements: Subtle map-inspired lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20 hidden md:block">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M10,20 Q40,10 70,30 T90,80" fill="none" stroke="white" strokeWidth="0.05" strokeDasharray="1,2" />
              <path d="M20,70 Q50,60 80,90" fill="none" stroke="white" strokeWidth="0.05" strokeDasharray="1,2" />
              <path d="M5,50 L95,50" fill="none" stroke="white" strokeWidth="0.02" strokeDasharray="2,4" />
            </svg>
          </div>
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[0] = el; }}
            className="max-w-7xl mx-auto reveal relative z-10"
          >
            <div className="grid lg:grid-cols-12 gap-12 mb-12 items-end">
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                  <Globe size={12} className="text-white/60" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('europe_tag')}</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm">
                  {t('europe_title')} <br/> 
                  <span className="font-bold">{t('europe_subtitle')}</span>
                </h2>
              </div>
              <div className="lg:col-span-6 lg:border-l lg:border-white/10 lg:pl-12">
                <p className="text-stone-400 text-sm md:text-base font-light leading-relaxed max-w-lg mb-0 italic">
                  {t('europe_desc')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-4 h-auto lg:h-[550px]">
              
              {/* PARIS: Main Hub - Large Bento Item */}
              <div className="lg:col-span-2 lg:row-span-2 group relative border border-white/10 rounded-[2.4rem] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop" 
                  alt="Paris" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-65 group-hover:opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent"></div>
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
              </div>

              {/* MUNICH */}
              <div className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full">
                <img 
                  src="https://images.unsplash.com/photo-1595867818082-083862f3d630?q=80&w=2070&auto=format&fit=crop" 
                  alt="Munich" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-65 group-hover:opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-xl font-semibold text-white uppercase tracking-wider">Munich</h3>
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-[0.1em]">{t('europe_munich_tag')}</span>
                </div>
              </div>

              {/* MILAN */}
              <div className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full">
                <img 
                  src="https://images.unsplash.com/photo-1610016302534-6f67f1c968d8?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=ouael-ben-salah-0xe2FGo7Vc0-unsplash.jpg" 
                  alt="Milan" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-65 group-hover:opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-xl font-semibold text-white uppercase tracking-wider">Milan</h3>
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-[0.1em]">{t('europe_milan_tag')}</span>
                </div>
              </div>

              {/* BERLIN */}
              <div className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full">
                <img 
                  src="https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=2070&auto=format&fit=crop" 
                  alt="Berlin" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-65 group-hover:opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-xl font-semibold text-white uppercase tracking-wider">Berlin</h3>
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-[0.1em]">{t('europe_berlin_tag')}</span>
                </div>
              </div>

              {/* FRANCE / AMSTERDAM Hybrid Duo */}
              <div className="lg:col-span-1 group relative border border-white/10 rounded-[2rem] overflow-hidden h-64 lg:h-full bg-stone-800/40">
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white uppercase mb-2 tracking-tight">{t('europe_connect_title')}</h3>
                    <p className="text-stone-400 text-xs font-light leading-relaxed">
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
              </div>

            </div>
          </div>
        </section>

        {/* Section Nos Services */}
        <section id="services" className="bg-stone-900 w-full py-20 border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 px-6">
            {/* Header with standard project SPEC - Split Layout */}
            <div 
              ref={el => { if (el) revealRefs.current[5] = el; }}
              className="grid lg:grid-cols-12 gap-12 items-end reveal"
            >
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                  <Briefcase size={12} className="text-white/60" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('services_tag')}</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm leading-none">
                  {t('services_title')}
                </h2>
                <div className="h-1 w-12 bg-white/20 rounded-full mt-10"></div>
              </div>
              <div className="lg:col-span-6 lg:border-l lg:border-white/10 lg:pl-12">
                <p className="text-stone-400 text-lg md:text-xl font-light leading-relaxed mb-0 italic">
                  {t('services_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Horizontal Scroll Layout - Version Full-Width "Hors Cadre" */}
          <div className="relative mt-12 overflow-hidden">
            {/* Native Horizontal Scroll Container with Edge Bleed */}
            <div 
              ref={servicesScrollRef}
              className="flex gap-6 overflow-x-auto pb-12 snap-x snap-mandatory px-6 lg:px-0 lg:pl-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))]"
            >
              {[...Array(5)].map((_, i) => (
                <div 
                  key={`card-${i}`} 
                  className="w-[85vw] md:w-[calc(50%-12px)] lg:w-[420px] h-[550px] border border-white/5 rounded-[2.5rem] bg-stone-950 shadow-2xl flex flex-col shrink-0 group transition-all hover:scale-[1.01] overflow-hidden snap-center relative"
                >
                  {/* Full Card Background Image */}
                  <img 
                    src={[
                      "https://mcslimo.fr/wp-content/uploads/2025/01/MCS-Services-5.jpg",
                      "https://mcslimo.fr/wp-content/uploads/2025/01/MCS-Services-4.jpg",
                      "https://mcslimo.fr/wp-content/uploads/2025/01/MCS-Services-8.jpg",
                      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069",
                      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070"
                    ][i]}
                    alt={t(`service${i + 1}_title`)}
                    className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-80 transition-all duration-1000 grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                  {/* Overlay Content */}
                  <div className="relative z-10 h-full p-10 flex flex-col justify-between">
                    <div className="flex justify-start items-start">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 group-hover:border-white/20 transition-all backdrop-blur-sm">
                        {[<Navigation size={20} />, <Briefcase size={20} />, <MapPin size={20} />, <Calendar size={20} />, <Building2 size={20} />][i]}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight leading-none">
                           {t(`service${i + 1}_title`)}
                        </h3>
                        <div className="h-0.5 w-8 bg-white/20 group-hover:w-16 transition-all duration-700"></div>
                      </div>
                      
                      <p className="text-stone-300 text-sm font-light leading-relaxed max-w-[280px] opacity-80 group-hover:opacity-100 transition-opacity">
                        {t(`service${i + 1}_desc`)}
                      </p>

                      <div className="flex items-center gap-2 pt-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">En savoir plus</span>
                        <ArrowRight size={14} className="text-white transition-all group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Extra spacer to allow last card clean finish */}
              <div className="w-6 lg:w-12 shrink-0"></div>
            </div>
            
            {/* Navigation Arrows and Scroll Hint */}
            <div className="max-w-7xl mx-auto px-6 mt-8 flex justify-between items-center">
              <div className="flex gap-4">
                <button 
                  onClick={() => scrollServices('prev')}
                  className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
                  aria-label="Previous service"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => scrollServices('next')}
                  className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
                  aria-label="Next service"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="flex justify-end gap-2 text-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className="hidden sm:inline">Scroll to explore</span>
                <ArrowRight size={10} className="mt-0.5 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Section Transferts Populaires */}
        <section id="transfers" className="bg-stone-900 w-full py-20 border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 px-6">
             {/* Header with standard project SPEC */}
             <div 
              ref={el => { if (el) revealRefs.current[10] = el; }}
              className="flex flex-col items-center mb-16 text-center reveal"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Tag size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('transfers_tag')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm text-center">
                {t('transfers_title')}
              </h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
              <p className="text-stone-400 text-lg font-light leading-relaxed max-w-3xl mt-12 text-center italic">
                {t('transfers_desc')}
              </p>
            </div>

            {/* Transfers Grid - Static Tall Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'route_cdg', price: '75€', time: '45 min', icon: <Navigation size={20} />, image: 'https://images.unsplash.com/photo-1594431795323-9267a492ad46?auto=format&fit=crop&q=80&w=800' },
                { key: 'route_orly', price: '65€', time: '35 min', icon: <MapPin size={20} />, image: 'https://images.unsplash.com/photo-1672310708154-771583101dbb?auto=format&fit=crop&q=80&w=800' },
                { key: 'route_beauvais', price: '160€', time: '80 min', icon: <Plane size={20} />, image: 'https://images.unsplash.com/photo-1768420281710-0887af16eded?auto=format&fit=crop&q=80&w=800' },
                { key: 'route_disney', price: '110€', time: '50 min', icon: <Sparkles size={20} />, image: 'https://hubertraguet.com/wp-content/uploads/2021/05/laeroport-de-roissy-charles-de-gaulle-11.jpg' },
                { key: 'route_versailles', price: '90€', time: '40 min', icon: <Building2 size={20} />, image: 'https://media.istockphoto.com/id/978664034/fr/photo/a%C3%A9roport-de-paris-charles-de-gaulle-terminal.jpg?s=612x612&w=0&k=20&c=3HoBuKqPiTOXgOctNh35qZuzEUWM691p8WUcjAX4YRQ=', mobileHidden: true },
                { key: 'route_giverny', price: '250€', time: '75 min', icon: <Palette size={20} />, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?fm=jpg&q=60&w=3000&auto=format&fit=crop', mobileHidden: true },
              ].map((item, i) => {
                return (
                  <div 
                    key={i}
                    className={`group relative border rounded-[2.5rem] transition-all duration-500 overflow-hidden h-[320px] flex flex-col bg-stone-900 border-white/10 hover:border-white/20 shadow-2xl ${item.mobileHidden ? 'hidden md:flex' : 'flex'}`}
                  >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={item.image} 
                        alt={t(item.key)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-65 group-hover:opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent"></div>
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
                          <div className="flex items-center justify-between text-white/60 text-[9px] font-bold uppercase tracking-[0.2em] mb-5">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-white/40" />
                              <span>{item.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-white/40" />
                              <span>Fixé</span>
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
                  </div>
                );
              })}
            </div>
          </div>
        </section>





        {/* BUSINESS B2B */}
        <section 
          id="business" 
          className="bg-stone-900 w-full py-32 px-6 border-t border-white/5 relative overflow-hidden"
        >
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[1] = el; }}
            className="max-w-7xl mx-auto reveal relative z-10"
          >


            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="flex flex-col text-base font-light text-stone-400 tracking-wide">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-6 leading-tight uppercase">
                    {t('corp_subtitle')}
                  </h3>
              <p className="leading-relaxed mb-8">
                {t('corp_desc')}
              </p>
              <ul className="flex flex-col gap-4 mb-8">
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-linear" width="20" className="text-white mt-0.5" style={{ strokeWidth: 1.5 }}></iconify-icon>
                  <span>{t('corp_li1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-linear" width="20" className="text-white mt-0.5" style={{ strokeWidth: 1.5 }}></iconify-icon>
                  <span>{t('corp_li2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <iconify-icon icon="solar:check-circle-linear" width="20" className="text-white mt-0.5" style={{ strokeWidth: 1.5 }}></iconify-icon>
                  <span>{t('corp_li3')}</span>
                </li>
              </ul>
              <a href="#contact" className="text-base text-white font-normal border-b border-white/20 pb-1 w-fit hover:border-white transition-colors flex items-center gap-2">
                {t('corp_cta')}
                <iconify-icon icon="solar:arrow-right-up-linear" width="16" style={{ strokeWidth: 1.5 }}></iconify-icon>
              </a>
            </div>
            <div className="relative w-full aspect-square md:aspect-auto rounded-3xl overflow-hidden border border-white/10 bg-stone-900/50 flex items-center justify-center p-6 md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent"></div>
              
              <div className="w-full max-w-md border border-stone-200 rounded-[2rem] bg-white p-8 relative z-10 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 mb-6">
                  <Mail size={12} className="text-stone-500" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">{t('contact_pro')}</span>
                </div>
                
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-stone-900 font-bold mb-2 block ml-1">{t('field_name')}</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-all placeholder:text-stone-300"
                      placeholder={t('placeholder_name')}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-stone-900 font-bold mb-2 block ml-1">{t('field_company')}</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-all placeholder:text-stone-300"
                      placeholder={t('placeholder_company')}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-stone-900 font-bold mb-2 block ml-1">{t('email')}</label>
                    <input 
                      type="email" 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-all placeholder:text-stone-300"
                      placeholder={t('placeholder_email')}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-stone-900 font-bold mb-2 block ml-1">{t('field_message')}</label>
                    <textarea 
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-all h-24 resize-none placeholder:text-stone-300"
                      placeholder={t('placeholder_message')}
                    ></textarea>
                  </div>
                  <button className="w-full bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-stone-800 transition-all mt-4 flex items-center justify-center gap-2 group">
                    <span>{t('contact_btn')}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Flotte */}
        <div id="fleet" className="bg-stone-925 w-full py-32 flex flex-col items-center border-t border-white/5 relative overflow-hidden">
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[7] = el; }}
            className="max-w-7xl mx-auto px-6 w-full reveal relative z-10"
          >
            <div className="flex flex-col items-center mb-24 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Navigation size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('fleet_tag')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm">{t('fleet_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-base font-light text-stone-400 tracking-wide">
              {[
                { type: 'Business', model: 'Classe E', img: 'https://mcslimo.fr/wp-content/uploads/2023/04/eclass.png', pax: `3 ${t('passengers')}`, bag: `3 ${t('luggage')}` },
                { type: 'Premium', model: 'Classe V', img: 'https://mcslimo.fr/wp-content/uploads/2023/04/vclass.png', pax: `7 ${t('passengers')}`, bag: `7 ${t('luggage')}`, isPremium: true },
                { type: 'Luxe', model: 'Classe S', img: 'https://mcslimo.fr/wp-content/uploads/2023/04/sclass.png', pax: `3 ${t('passengers')}`, bag: `3 ${t('luggage')}` }
              ].map((car, i) => (
                <div key={i} className={`border ${car.isPremium ? 'border-white/20 bg-stone-800/40' : 'border-white/10 bg-stone-900/30'} rounded-[2.5rem] p-8 flex flex-col items-center backdrop-blur-sm shadow-2xl relative overflow-hidden group`}>
                  {car.isPremium && <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>}
                  <span className={`${car.isPremium ? 'bg-white text-stone-950' : 'bg-white/5 border border-white/10 text-white/80'} rounded-full px-5 py-2 text-xs font-normal tracking-[0.2em] uppercase mb-8 shadow-lg`}>
                    {car.type}
                  </span>
                  <h3 className="text-3xl font-bold tracking-tight uppercase text-white/90 mb-10">{car.model}</h3>
                  <div className="w-full aspect-[4/3] flex items-center justify-center mb-10 bg-white rounded-3xl p-6">
                    <img src={car.img} alt={car.model} className="w-full object-contain grayscale group-hover:scale-105 transition-transform duration-700 mix-blend-multiply" referrerPolicy="no-referrer" />
                  </div>
                  <div className={`w-full grid grid-cols-2 gap-y-6 pt-8 border-t ${car.isPremium ? 'border-white/20' : 'border-white/10'}`}>
                    <div className="flex items-center gap-3 justify-center">
                      <iconify-icon icon="solar:users-group-rounded-linear" width="20" className={car.isPremium ? 'text-white/60' : 'text-white/40'} style={{ strokeWidth: 1.5 }}></iconify-icon>
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>{car.pax}</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <iconify-icon icon="solar:case-minimalistic-linear" width="20" className={car.isPremium ? 'text-white/60' : 'text-white/40'} style={{ strokeWidth: 1.5 }}></iconify-icon>
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>{car.bag}</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <iconify-icon icon="solar:wi-fi-router-linear" width="20" className={car.isPremium ? 'text-white/60' : 'text-white/40'} style={{ strokeWidth: 1.5 }}></iconify-icon>
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>Wi-Fi Inclus</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <iconify-icon icon="solar:bottle-linear" width="20" className={car.isPremium ? 'text-white/60' : 'text-white/40'} style={{ strokeWidth: 1.5 }}></iconify-icon>
                      <span className={`text-xs font-light tracking-[0.15em] uppercase ${car.isPremium ? 'text-white/80' : 'text-white/60'}`}>Boissons</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GALERIE */}
        <section 
          id="gallery" 
          className="bg-stone-900 w-full py-20 border-t border-white/5 relative overflow-hidden"
        >
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[4] = el; }}
            className="w-full reveal relative z-10"
          >
            <div className="max-w-6xl mx-auto px-6 flex flex-col items-center mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Star size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('vision_tag')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm">{t('vision_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
              <p className="mt-8 text-stone-400 font-light tracking-wide max-w-xl mx-auto text-sm">
                {t('vision_desc')}
              </p>
            </div>
            
            <div className="relative overflow-hidden py-4 w-full">
              {/* Gradients pour l'effet de disparition */}
              <div className="absolute left-0 top-0 bottom-0 w-32 z-20 bg-gradient-to-r from-stone-900 via-stone-900/50 to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 z-20 bg-gradient-to-l from-stone-900 via-stone-900/50 to-transparent pointer-events-none"></div>

              <div 
                className={`flex gap-6 w-max animate-marquee ${isGalleryPaused ? '[animation-play-state:paused]' : ''}`}
                onMouseEnter={() => setIsGalleryPaused(true)}
                onMouseLeave={() => setIsGalleryPaused(false)}
              >
                {[...Array(4)].map((_, setIndex) => (
                  <Fragment key={`set-${setIndex}`}>
                    {/* Image 1: Portrait Interior */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 aspect-[3/4] h-[320px] md:h-[420px] flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1629019878688-f5d58a41b188?q=85&fm=jpg&crop=entropy&cs=srgb" 
                        alt={t('gallery_img1_alt')} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/0 transition-colors duration-500"></div>
                    </div>

                    {/* Image 2: Portrait Center Detail */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 aspect-[3/4] h-[320px] md:h-[420px] flex-shrink-0">
                      <img 
                        src="https://prestige-transfer-london.com/transfer/mercedes-v-londone_web.jpg" 
                        alt={t('gallery_img2_alt')} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-950/10 group-hover:bg-stone-950/0 transition-colors duration-500"></div>
                    </div>

                    {/* Image 3: Portrait End Detail */}
                    <div className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 aspect-[3/4] h-[320px] md:h-[420px] flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1720731035872-7aa3708996c1?q=85&fm=jpg&crop=entropy&cs=srgb" 
                        alt={t('gallery_img3_alt')} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/0 transition-colors duration-500"></div>
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
          className="bg-stone-900 w-full py-32 px-6 border-t border-white/5 relative overflow-hidden"
        >
          {/* Subtle background lift */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none hidden md:block"></div>
          
          <div 
            ref={el => { if (el) revealRefs.current[2] = el; }}
            className="max-w-7xl mx-auto reveal relative z-10"
          >
            <div className="flex flex-col items-center mb-20 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <MessageSquare size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{t('reviews_tag')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm">{t('reviews_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <iconify-icon icon="logos:google-icon" width="20"></iconify-icon>
                  <span className="text-white font-medium">Google</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex text-[#FBBC05]">
                    <iconify-icon icon="solar:star-bold" width="14"></iconify-icon>
                    <iconify-icon icon="solar:star-bold" width="14"></iconify-icon>
                    <iconify-icon icon="solar:star-bold" width="14"></iconify-icon>
                    <iconify-icon icon="solar:star-bold" width="14"></iconify-icon>
                    <iconify-icon icon="solar:star-bold" width="14"></iconify-icon>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium leading-none text-sm">{t('excellent')}</span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest mt-1">{t('verified_count')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden py-12 px-4 md:px-12">
              {/* Navigation chevrons */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 z-30">
                <button 
                  onClick={() => setCurrentReviewIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentReviewIndex === 0}
                  className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${currentReviewIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 text-white active:scale-95'}`}
                  aria-label={t('previous')}
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-0 z-30">
                <button 
                  onClick={() => setCurrentReviewIndex(prev => {
                    const itemsPerPage = typeof window !== 'undefined' ? (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1) : 3;
                    const max = Math.ceil(reviews.length / itemsPerPage) - 1;
                    return Math.min(max, prev + 1);
                  })}
                  className="w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-95"
                  aria-label={t('next')}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Slider Container */}
              <div className="overflow-hidden">
                <motion.div 
                  className="flex gap-6 transition-all duration-700 ease-in-out"
                  animate={{ x: `calc(-${currentReviewIndex * 100}% - ${currentReviewIndex * 24}px)` }}
                >
                  {reviews.map((review, i) => (
                    <div 
                      key={`rev-${i}`} 
                      className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] border border-white/5 rounded-2xl p-8 bg-white/[0.03] backdrop-blur-sm shadow-xl flex flex-col shrink-0 group transition-all hover:bg-white/[0.05] hover:border-white/10"
                    >
                      <div className="flex gap-1 text-[#FBBC05] mb-6">
                        <iconify-icon icon="solar:star-bold" width="18"></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="18"></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="18"></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="18"></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="18"></iconify-icon>
                      </div>
                      <p className="leading-relaxed mb-8 text-stone-300 font-light text-[15px] italic">
                        {review.text}
                      </p>
                      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                        <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-sm font-semibold text-white border border-white/10 group-hover:bg-stone-700 transition-colors">
                          {review.initial}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white/90">{review.name}</span>
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-0.5">{t('verified_label')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-12">
                {[...Array(Math.ceil(reviews.length / (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 3 : typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1)))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentReviewIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentReviewIndex === i ? 'w-8 bg-white' : 'bg-white/20 hover:bg-white/40'}`}
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
          
          <div className="flex flex-col items-center mb-16 text-center px-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
              <Calendar size={12} className="text-white/60" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">Booking</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm">{t('title')}</h2>
            <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
          </div>
          
          <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/10">
              <div className="grid lg:grid-cols-12">
                
                {/* Left Side: Form */}
                <div className="lg:col-span-7 p-6 md:p-12 border-r border-stone-100">
                  {/* Progress */}
                  <div className="flex items-center gap-4 mb-8 md:mb-12">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                          {s}
                        </div>
                        {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-stone-900' : 'bg-stone-200'}`}></div>}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Ride Details */}
                  {step === 1 && (
                    <div className="space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4 md:space-y-6 relative flex flex-col">
                        <motion.div layout className="space-y-2 order-1">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('pickup_label')}</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input 
                              type="text" 
                              value={bookingData.pickup}
                              onChange={(e) => {
                                setBookingData(prev => ({ ...prev, pickup: e.target.value, pickupCoords: null }));
                                searchAddress(e.target.value, 'pickup');
                                if (bookingError) setBookingError(null);
                              }}
                              placeholder={t('pickup_placeholder')} 
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 pl-12 pr-4 text-stone-900 placeholder:text-stone-300 focus:border-stone-900 focus:bg-white outline-none transition-all"
                            />
                          </div>
                          {suggestions.pickup.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xl">
                              {suggestions.pickup.map((item, i) => (
                                <button 
                                  key={i}
                                  onClick={() => selectAddress(item, 'pickup')}
                                  className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors border-b border-stone-50 last:border-0"
                                >
                                  {item.display_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>

                        {/* Swap Button */}
                        <div className="absolute right-8 top-[calc(50%-44px)] sm:top-1/2 -translate-y-1/2 z-20 md:-right-6 md:top-1/2 md:translate-x-0">
                          <button 
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
                            className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
                            title="Inverser les adresses"
                          >
                            <iconify-icon icon="solar:transfer-vertical-linear" width="20"></iconify-icon>
                          </button>
                        </div>

                        <motion.div layout className="space-y-2 order-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('dropoff_label')}</label>
                          <div className="relative">
                            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input 
                              type="text" 
                              value={bookingData.dropoff}
                              onChange={(e) => {
                                setBookingData(prev => ({ ...prev, dropoff: e.target.value, dropoffCoords: null }));
                                searchAddress(e.target.value, 'dropoff');
                                if (bookingError) setBookingError(null);
                              }}
                              placeholder={t('dropoff_placeholder')} 
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 pl-12 pr-4 text-stone-900 placeholder:text-stone-300 focus:border-stone-900 focus:bg-white outline-none transition-all"
                            />
                          </div>
                          {suggestions.dropoff.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xl">
                              {suggestions.dropoff.map((item, i) => (
                                <button 
                                  key={i}
                                  onClick={() => selectAddress(item, 'dropoff')}
                                  className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors border-b border-stone-50 last:border-0"
                                >
                                  {item.display_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">Créneau Horaire</label>
                          <select 
                            value={bookingData.time}
                            onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 px-4 text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition-all appearance-none"
                          >
                            {timeSlots.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">Passagers</label>
                          <select 
                            value={bookingData.passengers}
                            onChange={(e) => setBookingData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 px-4 text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition-all appearance-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                              <option key={n} value={n}>{n} {n > 1 ? 'Passagers' : 'Passager'}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button 
                          onClick={() => setBookingData(prev => ({ ...prev, isReturnTrip: !prev.isReturnTrip }))}
                          className={`w-full flex items-center justify-between p-2.5 md:p-3.5 rounded-xl border-2 transition-all ${bookingData.isReturnTrip ? 'border-stone-900 bg-stone-50' : 'border-stone-100 bg-white hover:border-stone-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bookingData.isReturnTrip ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                              <iconify-icon icon="solar:refresh-linear" width="20"></iconify-icon>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-bold text-stone-900">{t('returnTrip')}</div>
                              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">Ajouter un trajet retour</div>
                            </div>
                          </div>
                          <div className={`w-12 h-6 rounded-full relative transition-all ${bookingData.isReturnTrip ? 'bg-stone-900' : 'bg-stone-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${bookingData.isReturnTrip ? 'left-7' : 'left-1'}`}></div>
                          </div>
                        </button>

                        {bookingData.isReturnTrip && (
                          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">Créneau Horaire Retour</label>
                              <select 
                                value={bookingData.returnTime}
                                onChange={(e) => setBookingData(prev => ({ ...prev, returnTime: e.target.value }))}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 px-4 text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition-all appearance-none"
                              >
                                {timeSlots.map(slot => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={handleNextStep1}
                          disabled={loading}
                          className="w-full bg-stone-900 text-white py-3 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : t('next')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Vehicle */}
                  {step === 2 && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-3 md:space-y-4">
                        {Object.entries(vehicles).map(([key, vehicle]) => (
                          <button 
                            key={key}
                            onClick={() => setBookingData(prev => ({ ...prev, vehicle: key }))}
                            className={`w-full flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl border-2 transition-all ${bookingData.vehicle === key ? 'border-stone-900 bg-stone-50' : 'border-stone-100 bg-white hover:border-stone-200'}`}
                          >
                            <div className="w-24 h-16 bg-stone-100 rounded-xl flex items-center justify-center p-2 shrink-0">
                              <img src={vehicle.img} alt={vehicle.name} className="w-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-base font-bold text-stone-900">{vehicle.name}</div>
                              <div className="text-xs text-stone-400 uppercase tracking-wider font-medium">{vehicle.model}</div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium"><Users size={14} /> {vehicle.pax}</span>
                                <span className="flex items-center gap-1.5 text-xs text-stone-500 font-medium"><Briefcase size={14} /> {vehicle.bag}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-stone-900">
                                {Math.round(vehicle.basePrice + (bookingData.distance > 10 ? (bookingData.distance - 10) * 2 : 0))}€
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setStep(1)}
                          className="flex-1 bg-stone-100 text-stone-600 py-3 md:py-4 rounded-xl font-bold hover:bg-stone-200 transition-all"
                        >
                          {t('back')}
                        </button>
                        <button 
                          onClick={() => setStep(3)}
                          className="flex-[2] bg-stone-900 text-white py-3 md:py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                        >
                          {t('next')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Contact & Recap */}
                  {step === 3 && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('firstName')}</label>
                          <input 
                            type="text" 
                            value={bookingData.firstName}
                            onChange={(e) => setBookingData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 px-4 text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('lastName')}</label>
                          <input 
                            type="text" 
                            value={bookingData.lastName}
                            onChange={(e) => setBookingData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 px-4 text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('email')}</label>
                          <input 
                            type="email" 
                            value={bookingData.email}
                            onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 px-4 text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">{t('phone')}</label>
                          <input 
                            type="tel" 
                            value={bookingData.phone}
                            onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 md:py-4 px-4 text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-stone-100">
                        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider ml-1">Mode de paiement</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'card', name: t('card'), icon: CreditCard },
                            { id: 'cash', name: t('cash'), icon: Users },
                            { id: 'transfer', name: t('transfer'), icon: ArrowRight }
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
                          onClick={() => setStep(2)}
                          className="flex-1 bg-stone-100 text-stone-600 py-3 md:py-4 rounded-xl font-bold hover:bg-stone-200 transition-all"
                        >
                          {t('back')}
                        </button>
                        <button 
                          onClick={handleBooking}
                          disabled={loading}
                          className="flex-[2] bg-stone-900 text-white py-3 md:py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                          {t('confirm')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Success */}
                  {step === 4 && (
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
                          setBookingData(prev => ({ ...prev, pickup: '', dropoff: '', pickupCoords: null, dropoffCoords: null }));
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
                <div className="lg:col-span-5 bg-stone-50 p-6 md:p-10 flex flex-col transition-all duration-500">
                  {/* Map Container - Consistent height across all steps */}
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm relative h-[180px] md:h-[250px] mb-4 md:mb-6 transition-all duration-500">
                    <div ref={mapContainerRef} className="w-full h-full z-0" />
                    <div className="absolute bottom-4 right-4 z-10">
                      <div className="bg-white border border-stone-200 rounded-lg p-2 px-3 text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-3 shadow-lg">
                        <span>{Math.round(bookingData.distance)} KM</span>
                        <div className="w-px h-3 bg-stone-200"></div>
                        <span>{Math.round(bookingData.duration)} MIN</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary - Visible in Step 1, 2 and 3 with Dark Design */}
                  <div className={`flex-1 flex-col transition-all duration-500 overflow-hidden bg-stone-900 rounded-2xl p-4 md:p-6 border border-white/5 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none h-0'} ${step === 1 ? 'hidden md:flex' : 'flex'}`}>
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
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('arrival')}</div>
                            <div className="text-xs text-white/80 font-medium line-clamp-1">{bookingData.dropoff || '—'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">Créneau</div>
                          <div className="text-xs text-white/80 font-medium">{bookingData.time || '—'}</div>
                        </div>
                        {bookingData.isReturnTrip && (
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('returnTrip')}</div>
                            <div className="text-xs text-white/80 font-medium">{bookingData.returnTime || '—'}</div>
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{step < 2 ? 'Distance' : t('step2')}</div>
                          <div className="text-xs text-white/80 font-medium">
                            {step < 2 ? `${Math.round(bookingData.distance)} KM` : (vehicles as any)[bookingData.vehicle].name}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5">
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{t('total')}</div>
                          <div className="text-3xl font-bold text-white">{step < 2 ? '...' : `${totalPrice}€`}</div>
                        </div>
                        <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1">{t('vatIncluded')}</div>
                      </div>
                      {step >= 2 && (
                        <p className="text-[10px] text-white/40 mt-4 leading-relaxed font-light italic">
                          {t('depositNotice')}
                        </p>
                      )}
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
            <div className="flex flex-col items-center mb-20 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Info size={12} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">FAQ</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight uppercase text-white drop-shadow-sm">{t('faq_title')}</h2>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-8"></div>
            </div>
            <div className="flex flex-col border-t border-white/15">
              {[
                { q: t('q1'), a: t('a1') },
                { q: t('q2'), a: t('a2') },
                { q: t('q3'), a: t('a3') },
                { q: t('q4'), a: t('a4') }
              ].map((faq, i) => (
                <div key={i} className={`faq-item w-full border-b border-white/15 group ${openFaqIndex === i ? 'open' : ''}`}>
                  <button 
                    onClick={() => toggleFaq(i)}
                    className="w-full py-6 flex justify-between items-center text-base md:text-lg font-normal text-white hover:text-stone-300 transition-colors text-left" 
                    aria-expanded={openFaqIndex === i}
                  >
                    {faq.q}
                    <iconify-icon icon="solar:alt-arrow-down-linear" width="20" className="text-stone-500 faq-icon" style={{ strokeWidth: 1.5 }}></iconify-icon>
                  </button>
                  <div className="faq-content">
                    <div className="pb-6 text-[14.5px] text-stone-400 font-light leading-relaxed tracking-wide">
                      {faq.a}
                    </div>
                  </div>
                </div>
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
              <h1 className="text-[19px] font-medium tracking-[0.25em] uppercase text-white/70 mb-5">Safeness & Transferts</h1>
              <p className="text-[15px] font-light text-stone-400 tracking-wide max-w-lg">
                {t('footer_desc')}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-x-12 gap-y-6 md:gap-y-5 mb-16 text-[13px] font-normal tracking-[0.15em] uppercase text-white md:text-white/50">
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
            <div className="flex flex-col md:flex-row items-center justify-between w-full text-[12px] text-white/30 uppercase tracking-[0.2em] mt-8 gap-4 text-center font-normal">
              <p>Safeness & Transferts © 2026. All Rights Reserved.</p>
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
            className={`w-14 h-14 bg-stone-900 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-stone-800 transition-all shadow-2xl ${showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'}`}
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
