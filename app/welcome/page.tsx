"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Flame,
  Info,
  MapPin,
  Menu,
  Music,
  Navigation,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Users,
  Volume2,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Target Event Date: October 11, 2026 at 9:00 PM (21:00) IST
const EVENT_TARGET_DATE = new Date("2026-10-11T21:00:00+05:30").getTime();
const REGISTRATION_URL = "/registration/reg_c30f16fedbfb";
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/WjA94KiergA8LHVs5";
const LATITUDE = 22.245078904784286;
const LONGITUDE = 68.95867353330141;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function WelcomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "singers" | "sponsors">("all");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = EVENT_TARGET_DATE - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${LATITUDE}, ${LONGITUDE}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  const singers = [
    {
      id: "singer-1",
      name: "Darshan Bhatt",
      gujaratiName: "દર્શન ભટ્ટ",
      title: "Folk Star",
      badge: "ફોક સ્ટાર",
      genre: "Traditional Kathiyawadi & Raas Garba",
      image: "/images/singer/singer_1.jpeg",
      desc: "Celebrated voice of Devbhumi Dwarka delivering authentic, electrifying garba energy that connects generations.",
    },
    {
      id: "singer-2",
      name: "Kavita Zala",
      gujaratiName: "કવિતા ઝાલા",
      title: "Playback Singer",
      badge: "પ્લેબેક સિંગર",
      genre: "Modern & Folk Fusion Garba",
      image: "/images/singer/singer_2.jpeg",
      desc: "Sensational playback singer famous for heart-thumping beats, divine Maa Ambe stuti, and energetic dandiya tracks.",
    },
    {
      id: "singer-3",
      name: "Dipak Joshi",
      gujaratiName: "દીપક જોશી",
      title: "Playback Singer",
      badge: "પ્લેબેક સિંગર",
      genre: "Classical & Devotional Raas",
      image: "/images/singer/singer_3.jpeg",
      desc: "Renowned maestro renowned for powerful voice modulation, rhythmic taals, and soul-stirring Navratri melodies.",
    },
    {
      id: "singer-4",
      name: "Sumit Jani",
      gujaratiName: "સુમિત જાની",
      title: "Lok Gayak",
      badge: "લોક ગાયક",
      genre: "Traditional Folk & Dakla Beats",
      image: "/images/singer/singer_4.jpeg",
      desc: "High-voltage folk singer who commands the stage with explosive dhol beats and timeless Gujarati lok-geet.",
    },
  ];

  const sponsors = [
    {
      id: "sponser-1",
      name: "Pabubha Manek",
      gujaratiName: "પબુભા માણેક",
      role: "MLA - Dwarka, Gujarat",
      status: "Main Sponsor & Chief Patron",
      image: "/images/sponser/sponser_1.jpg",
      highlight: "Honorable Member of Legislative Assembly, Devbhumi Dwarka",
      desc: "Visionary leader and beloved representative dedicated to fostering Gujarati culture, spiritual unity, and grand celebrations for all citizens.",
      quote: "દ્વારકાના સાંસ્કૃતિક વારસા અને માઁ આરાધનાના આ મહાપર્વમાં સૌ ખેલૈયાઓનું હાર્દિક સ્વાગત છે.",
    },
    {
      id: "sponser-2",
      name: "Sahadev Manek",
      gujaratiName: "સહદેવ માણેક",
      role: "Son of MLA Dwarka",
      status: "Main Sponsor & Youth Patron",
      image: "/images/sponser/sponser_2.jpeg",
      highlight: "Youth Leader & Cultural Patron, Devbhumi Dwarka",
      desc: "Driving youthful vibrancy, world-class infrastructure, high safety standards, and mesmerizing concert experiences for Navratri enthusiasts.",
      quote: "યુવાનો અને પરિવારો માટે સુરક્ષિત, શિસ્તબદ્ધ અને ભવ્ય નવરાત્રી રાસોત્સવનું આયોજન એ અમારો સંકલ્પ છે.",
    },
  ];

  const highlights = [
    {
      icon: Flame,
      title: "Maha Aarti Daily",
      gujTitle: "નવદુર્ગા મહા આરતી",
      desc: "Divine commencement each evening at 9:00 PM with 108 deepak aarti and sacred stutis.",
    },
    {
      icon: Volume2,
      title: "Mega Concert Acoustics",
      gujTitle: "વિશ્વસ્તરીય સાઉન્ડ સિસ્ટમ",
      desc: "Ultra-high-definition line array system with synchronized intelligent laser and stage lighting.",
    },
    {
      icon: Award,
      title: "Daily Royal Prizes",
      gujTitle: "રોકડ ઇનામો અને ટ્રોફી",
      desc: "Grand recognition for Best Traditional Dress (Male/Female), Garba Prince & Princess, and Best Raas Group.",
    },
    {
      icon: ShieldCheck,
      title: "Z-Grade Safety & CCTV",
      gujTitle: "સુરક્ષિત કૌટુંબિક માહોલ",
      desc: "Dedicated women safety squads, 360° HD surveillance, emergency medical desk, and organized parking.",
    },
    {
      icon: Users,
      title: "Mega Ground Arena",
      gujTitle: "વિશાળ ગરબા ગ્રાઉન્ડ",
      desc: "Spacious wooden/cushioned dancing ring designed for 10,000+ simultaneous raas khelaiyas comfortably.",
    },
    {
      icon: Ticket,
      title: "Digital QR Passes",
      gujTitle: "ડિજિટલ ક્યૂઆર પાસ",
      desc: "Fast-track turnstile scanning for seamless, queue-free entry for registered participants.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#140104] text-amber-50 selection:bg-amber-500 selection:text-black overflow-x-hidden font-sans">
      {/* Background Ambience & Festive Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top radial warm festive crimson burst */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[650px] bg-[radial-gradient(circle_at_center,rgba(180,18,36,0.35)_0%,rgba(100,5,18,0.18)_50%,transparent_75%)] blur-3xl" />
        {/* Golden ambient glows */}
        <div className="absolute top-[25%] left-[-10%] w-[550px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute top-[55%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.14)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[5%] left-1/3 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.2)_0%,transparent_70%)] blur-3xl" />

        {/* Subtle traditional rangoli/mandala pattern watermark */}
        <div
          className="absolute inset-0 opacity-[0.035] bg-repeat"
          style={{
            backgroundImage: `radial-gradient(#fbbf24 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* =========================================================================
          TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1b0206]/85 border-b border-amber-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Festival Branding */}
            <Link href="/welcome" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#290308] flex items-center justify-center overflow-hidden">
                  <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 font-serif">
                    માણેક નવરાત્રી
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold tracking-wider">
                    2026
                  </span>
                </div>
                <span className="text-[11px] text-amber-200/70 tracking-widest uppercase font-medium">
                  Devbhumi Dwarka
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-amber-100/80">
              <a href="#hero" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                Home
              </a>
              <a href="#countdown" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                Countdown
              </a>
              <a href="#sponsors" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                Sponsors
              </a>
              <a href="#singers" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                Artists
              </a>
              <a href="#highlights" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                Highlights
              </a>
              <a href="#location" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                Venue & Map
              </a>
            </nav>

            {/* Top Right Action Buttons (Registration & Login Required) */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Register Pass CTA */}
              <Link
                href={REGISTRATION_URL}
                className="relative group overflow-hidden px-4 py-2.5 rounded-xl font-bold text-sm text-[#2a0408] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
              >
                <Ticket className="w-4 h-4 text-[#2a0408]" />
                <span>Register Pass</span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform" />
              </Link>
            </div>

            {/* Mobile Menu Hamburger */}
            <div className="flex sm:hidden items-center gap-2">
              <Link
                href={REGISTRATION_URL}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#2a0408] bg-gradient-to-r from-amber-300 to-yellow-400 shadow-sm"
              >
                Register
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-white/5 border border-amber-500/20 text-amber-200 hover:text-amber-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-amber-500/20 bg-[#1f0207]/95 backdrop-blur-2xl px-6 py-6 space-y-4"
            >
              <nav className="flex flex-col space-y-3 text-base font-medium">
                <a
                  href="#hero"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-amber-500/10 text-amber-100 hover:text-amber-300"
                >
                  Home
                </a>
                <a
                  href="#countdown"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-amber-500/10 text-amber-100 hover:text-amber-300"
                >
                  Live Countdown
                </a>
                <a
                  href="#sponsors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-amber-500/10 text-amber-100 hover:text-amber-300"
                >
                  Patrons & Sponsors
                </a>
                <a
                  href="#singers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-amber-500/10 text-amber-100 hover:text-amber-300"
                >
                  Celebrity Singers
                </a>
                <a
                  href="#highlights"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-amber-500/10 text-amber-100 hover:text-amber-300"
                >
                  Festival Highlights
                </a>
                <a
                  href="#location"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-amber-500/10 text-amber-100 hover:text-amber-300"
                >
                  Venue & Map
                </a>
              </nav>

              <div className="pt-4 border-t border-amber-500/20 flex flex-col gap-3">
                <Link
                  href={REGISTRATION_URL}
                  className="w-full text-center py-3 rounded-xl font-bold text-sm text-[#2a0408] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-lg flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Register Navratri Pass</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =========================================================================
          HERO SECTION (Colors directly referenced from singer_1.jpeg)
          ========================================================================= */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Auspicious Inscription */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>॥ શ્રી ગણેશાય નમઃ ॥ શ્રી દ્વારકાધીશાય નમઃ ॥ જય બહુચર માઁ ॥</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            </div>
          </motion.div>

          {/* Grand Festival Titles */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
            >
              {/* Primary Calligraphic Title */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight">
                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D0] via-[#FFD700] to-[#E5A110] drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)] font-serif">
                  માણેક નવરાત્રી
                </span>
                <span className="block text-2xl sm:text-4xl md:text-5xl font-bold text-amber-200/90 mt-1 sm:mt-2 tracking-wide">
                  મહોત્સવ ૨૦૨૬
                </span>
              </h1>
            </motion.div>

            {/* English Tagline Matching singer_1.jpeg */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-3 pt-2"
            >
              <div className="inline-block">
                <span className="text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-[0.25em] text-[#2a0408] bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-6 py-2 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.6)] border border-amber-200">
                  BIGGEST NAVRATRI OF DEVBHUMI DWARKA
                </span>
              </div>

              <p className="text-base sm:text-xl text-amber-100/80 max-w-2xl mx-auto leading-relaxed font-normal pt-2">
                ભક્તિ, શક્તિ અને પરંપરાગત રાસ-ગરબાનો ૯ રાતનો અદ્ભુત ત્રિવેણી સંગમ. પવિત્ર યાત્રાધામ દ્વારકા નગરીમાં ગુજરાતના ખ્યાતનામ કલાકારો સંગાથે.
              </p>
            </motion.div>

            {/* Quick Key Event Info Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4 text-xs sm:text-sm font-semibold text-amber-200/90"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-950/80 to-amber-950/60 border border-amber-500/30 backdrop-blur-md">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>શરૂઆત: 11 ઑક્ટોબર 2026</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-950/80 to-amber-950/60 border border-amber-500/30 backdrop-blur-md">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>સમય: રાત્રે 9:00 કલાકે</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-950/80 to-amber-950/60 border border-amber-500/30 backdrop-blur-md">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>દેવભૂમિ દ્વારકા, ગુજરાત</span>
              </div>
            </motion.div>

            {/* Main Hero Call-to-Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
            >
              {/* Primary Register CTA */}
              <Link
                href={REGISTRATION_URL}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base sm:text-lg text-[#2a0408] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:shadow-[0_0_50px_rgba(245,158,11,0.8)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 border border-amber-200"
              >
                <Ticket className="w-5 h-5 text-[#2a0408]" />
                <span>Register Navratri Pass</span>
                <ArrowRight className="w-5 h-5 text-[#2a0408]" />
              </Link>

              {/* View Artists Button */}
              <a
                href="#singers"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-base text-amber-200 bg-white/5 hover:bg-white/10 border border-amber-400/40 hover:border-amber-400 shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Music className="w-5 h-5 text-amber-400" />
                <span>Meet Star Singers</span>
              </a>

              {/* Venue & Map Button */}
              <a
                href="#location"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-base text-amber-200 bg-white/5 hover:bg-white/10 border border-amber-400/40 hover:border-amber-400 shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5 text-amber-400" />
                <span>Venue & Map</span>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Decorative Golden Arch Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#140104] to-transparent pointer-events-none" />
      </section>

      {/* =========================================================================
          LIVE COUNTDOWN TIMER SECTION (Target: 11-10-2026 at 9:00 PM)
          ========================================================================= */}
      <section id="countdown" className="py-12 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#2e040b]/90 to-[#1b0206]/95 border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] backdrop-blur-xl">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

            {/* Header info */}
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs uppercase tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Live Countdown</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 font-serif">
                નવરાત્રી મહોત્સવ શુભારંભ
              </h2>
              <p className="text-sm sm:text-base text-amber-200/80">
                11 ઑક્ટોબર 2026, રવિવાર • રાત્રે 9:00 PM થી ભવ્ય આરંભ
              </p>
            </div>

            {/* 4 Cards: Days, Hours, Minutes, Seconds */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: "DAYS", guj: "દિવસ", value: mounted ? timeLeft.days : 0 },
                { label: "HOURS", guj: "કલાક", value: mounted ? timeLeft.hours : 0 },
                { label: "MINUTES", guj: "મિનિટ", value: mounted ? timeLeft.minutes : 0 },
                { label: "SECONDS", guj: "સેકન્ડ", value: mounted ? timeLeft.seconds : 0 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-[#400710] to-[#240308] border border-amber-400/30 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.5)] group hover:border-amber-400 transition-all"
                >
                  <div className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-yellow-500 font-mono tracking-tight">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-300 mt-2 tracking-wider">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-amber-200/60 font-medium">
                    {item.guj}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA under timer */}
            <div className="mt-8 pt-6 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-amber-200/80 text-xs sm:text-sm">
                <Ticket className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>
                  ખેલૈયાઓ અને દર્શકો માટે રજીસ્ટ્રેશન પાસ મેળવવો અનિવાર્ય છે. સીમિત પાસ ઉપલબ્ધ.
                </span>
              </div>
              <Link
                href={REGISTRATION_URL}
                className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#2a0408] bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-amber-400 hover:to-yellow-500 shadow-md transition-all whitespace-nowrap flex items-center gap-2"
              >
                <span>Get Pass Now</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN SPONSORS & PATRONS SECTION
          (1. Pabubha Manek - MLA Dwarka, Gujarat | 2. Sahadev Manek - Son of MLA Dwarka)
          ========================================================================= */}
      <section id="sponsors" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs uppercase tracking-wider font-bold">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>મુખ્ય પ્રેરક અને આયોજક</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 font-serif">
              Main Event Patrons & Sponsors
            </h2>
            <p className="text-sm sm:text-base text-amber-200/80">
              દેવભૂમિ દ્વારકાના ગૌરવશાળી સાંસ્કૃતિક વારસાને ઉજાગર કરતા માણેક પરિવારનું વિશેષ યોગદાન
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {sponsors.map((sponsor) => (
              <motion.div
                key={sponsor.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#2e050c] via-[#210308] to-[#160205] border-2 border-amber-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.6)] group"
              >
                {/* Glowing Top Frame Accent */}
                <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400" />

                <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                  {/* Portrait with Royal Circular Gold Border */}
                  <div className="relative mb-6">
                    <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                      <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-[#160205]">
                        <Image
                          src={sponsor.image}
                          alt={sponsor.name}
                          fill
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          priority
                        />
                      </div>
                    </div>
                    {/* Floating Badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[#2a0408] text-xs font-black uppercase tracking-wider shadow-lg whitespace-nowrap">
                      {sponsor.status}
                    </div>
                  </div>

                  {/* Sponsor Name & Details */}
                  <div className="space-y-2 mt-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-100 font-serif">
                      {sponsor.name}
                    </h3>
                    <div className="text-lg font-bold text-amber-400">
                      {sponsor.gujaratiName}
                    </div>
                    <div className="inline-block px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200 text-sm font-semibold">
                      {sponsor.role}
                    </div>
                  </div>

                  <p className="text-sm text-amber-200/75 mt-4 leading-relaxed">
                    {sponsor.desc}
                  </p>

                  {/* Traditional Gujarati Quote Box */}
                  <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-200/90 italic">
                    &ldquo;{sponsor.quote}&rdquo;
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          STAR SINGERS / ARTISTS SECTION
          (Darshan Bhatt, Kavita Zala, Dipak Joshi, Sumit Jani)
          ========================================================================= */}
      <section id="singers" className="py-20 relative z-10 bg-gradient-to-b from-transparent via-[#220308]/60 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs uppercase tracking-wider font-bold">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>સંગીતના સુર સમ્રાટ</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 font-serif">
              Star Singers & Folk Artists
            </h2>
            <p className="text-sm sm:text-base text-amber-200/80">
              ગુજરાતના સુપ્રસિદ્ધ કલાકારોના સૂરોની રમઝટ સાથે ખેલૈયાઓ જૂમશે માણેક નવરાત્રીના પ્રાંગણમાં
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {singers.map((singer) => (
              <motion.div
                key={singer.id}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#32060e] to-[#1c0206] border-2 border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group flex flex-col justify-between"
              >
                {/* Poster Image Container */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/40">
                  <Image
                    src={singer.image}
                    alt={singer.name}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Gradient overlay for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c0206] via-transparent to-black/30" />

                  {/* Top Badge: Folk Star / Playback Singer / Lok Gayak */}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[#2a0408] text-xs font-black shadow-lg uppercase tracking-wider">
                    {singer.title}
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                      {singer.badge}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-amber-100 font-serif">
                      {singer.name}
                    </h3>
                    <div className="text-sm font-semibold text-amber-300">
                      {singer.gujaratiName}
                    </div>
                    <div className="text-xs text-amber-200/60 mt-1 font-medium">
                      {singer.genre}
                    </div>
                  </div>

                  <p className="text-xs text-amber-100/70 line-clamp-3 leading-relaxed border-t border-amber-500/20 pt-3">
                    {singer.desc}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-amber-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live in Dwarka
                    </span>
                    <span className="text-[11px] text-amber-200/60">
                      Oct 11 onwards
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          EVENT HIGHLIGHTS & GRAND FESTIVAL FEATURES
          ========================================================================= */}
      <section id="highlights" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs uppercase tracking-wider font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>વિશેષ આકર્ષણો</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 font-serif">
              Why Manek Navratri is Grand
            </h2>
            <p className="text-sm sm:text-base text-amber-200/80">
              ગુજરાતની સંસ્કૃતિ અને આધુનિક આયોજનનું અનોખું સંયોજન, માત્ર માણેક નવરાત્રીમાં
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#2e050c]/80 to-[#1b0206]/90 border border-amber-500/30 hover:border-amber-400/70 shadow-lg backdrop-blur-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-[#2a0408] shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {item.gujTitle}
                  </div>
                  <h3 className="text-xl font-bold text-amber-100 mt-1 mb-2 font-serif">
                    {item.title}
                  </h3>
                  <p className="text-sm text-amber-200/70 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          REGISTRATION PASS PROMO BANNER (Links to /registration/reg_c30f16fedbfb)
          ========================================================================= */}
      <section id="register-banner" className="py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 bg-gradient-to-r from-[#450711] via-[#610a17] to-[#3a040c] border-2 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.3)]">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-[#2a0408] text-xs font-black uppercase tracking-wider">
                <Ticket className="w-3.5 h-3.5" />
                <span>ઓનલાઇન રજીસ્ટ્રેશન શરૂ</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-amber-100 font-serif leading-tight">
                Get Your Official Manek Navratri Pass
              </h2>
              <p className="text-base sm:text-lg text-amber-200/90 leading-relaxed">
                ખેલૈયાઓ અને દર્શકો પોતાના પરિવાર સાથે ગરબા મહોત્સવમાં ભાગ લેવા માટે નીચેની લિંક પરથી ઓનલાઇન પાસ રજીસ્ટ્રેશન મેળવી શકે છે.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href={REGISTRATION_URL}
                  className="px-8 py-4 rounded-2xl font-black text-base sm:text-lg text-[#2a0408] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:shadow-[0_0_45px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Ticket className="w-5 h-5 text-[#2a0408]" />
                  <span>Register Free Pass Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <div className="text-xs text-amber-200/70 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Instant QR Code Generation • Fast Entry Verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          VENUE & STATIC / EMBEDDED MAP SECTION
          (Coordinates: 22.245078904784286, 68.95867353330141)
          (Google Maps Link: https://maps.app.goo.gl/WjA94KiergA8LHVs5)
          ========================================================================= */}
      <section id="location" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs uppercase tracking-wider font-bold">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>સ્થળ અને નકશો</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 font-serif">
              Event Venue & Directions
            </h2>
            <p className="text-sm sm:text-base text-amber-200/80">
              પવિત્ર દ્વારકા નગરીમાં ભવ્ય ગરબા ગ્રાઉન્ડનું ચોક્કસ સરનામું અને ગૂગલ મેપ નેવિગેશન
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Venue Details Card */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#2e050c] to-[#1a0205] border-2 border-amber-500/40 shadow-xl space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-100 font-serif">
                      Manek Navratri Ground
                    </h3>
                    <p className="text-xs text-amber-300 font-medium">
                      માણેક નવરાત્રી મહોત્સવ ગ્રાઉન્ડ
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-amber-500/20 space-y-2">
                  <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                    Address / સરનામું
                  </div>
                  <p className="text-sm text-amber-100/90 leading-relaxed font-sans">
                    Manek Navratri Mahotsav Ground, Near Dwarka Bypass Highway, Devbhumi Dwarka, Gujarat - 361335
                  </p>
                  <p className="text-xs text-amber-200/60">
                    દ્વારકાધીશ મંદિરથી માત્ર 5 મિનિટના અંતરે, સુગમ વાહન પાર્કિંગ વ્યવસ્થા સાથે.
                  </p>
                </div>

                {/* Coordinates Info */}
                <div className="p-4 rounded-2xl bg-black/30 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      GPS Coordinates
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCoords}
                      className="text-xs text-amber-300 hover:text-amber-100 flex items-center gap-1 transition-colors"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-amber-200 bg-black/40 px-3 py-2 rounded-lg border border-amber-500/10 select-all">
                    {LATITUDE}, {LONGITUDE}
                  </div>
                </div>

                {/* Gate & Timings */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[11px] text-amber-300 font-semibold">ગેટ ઓપનિંગ</div>
                    <div className="text-sm font-bold text-amber-100">8:00 PM</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[11px] text-amber-300 font-semibold">મહા આરતી</div>
                    <div className="text-sm font-bold text-amber-100">9:00 PM</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-amber-500/20">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-[#2a0408] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-500 shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Navigation className="w-4 h-4 text-[#2a0408]" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-4 h-4 text-[#2a0408]" />
                </a>

                <Link
                  href={REGISTRATION_URL}
                  className="w-full py-3 px-4 rounded-2xl font-semibold text-xs sm:text-sm text-amber-200 bg-white/5 hover:bg-white/10 border border-amber-400/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>Get Entry Pass for this Venue</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Embedded Interactive & Static Map Box */}
            <div className="lg:col-span-7 rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl relative min-h-[380px] sm:min-h-[460px] bg-[#1a0205]">
              {/* Google Maps Embed iframe with Lat/Long */}
              <iframe
                title="Manek Navratri Location Map"
                src={`https://maps.google.com/maps?q=${LATITUDE},${LONGITUDE}&hl=en&z=15&output=embed`}
                width="100%"
                height="100%"
                className="w-full h-full min-h-[400px] border-0 filter contrast-125"
                loading="lazy"
                allowFullScreen
              />

              {/* Floating Quick Action Overlay on Map */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm p-4 rounded-2xl bg-[#1b0206]/90 backdrop-blur-xl border border-amber-400/40 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-[#2a0408] flex-shrink-0 font-bold">
                    📍
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="text-xs font-bold text-amber-200">
                      Devbhumi Dwarka, Gujarat
                    </div>
                    <div className="text-[11px] text-amber-100/70 font-mono">
                      Lat: {LATITUDE.toFixed(4)}, Long: {LONGITUDE.toFixed(4)}
                    </div>
                    <a
                      href={GOOGLE_MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-300 font-bold hover:underline pt-1"
                    >
                      <span>Navigate via GPS</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          NAVRATRI GUIDELINES & DRESS CODE (Garba Sanhita)
          ========================================================================= */}
      <section className="py-14 relative z-10 border-t border-amber-500/20 bg-black/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#240409] to-[#190205] border border-amber-500/30 space-y-6">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl sm:text-2xl font-bold text-amber-100 font-serif">
                મહત્વપૂર્ણ નિયમો અને ગરિમાપૂર્ણ સૂચનાઓ (Event Guidelines)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-amber-200/80">
              <div className="p-4 rounded-xl bg-white/5 border border-amber-500/20 space-y-1.5">
                <div className="font-bold text-amber-300">👘 પરંપરાગત વસ્ત્રો (Dress Code)</div>
                <p>ખેલૈયાઓ માટે ચણિયાચોળી અને કેડિયા-કુર્તા જેવા પરંપરાગત વસ્ત્રો અનિવાર્ય છે.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-amber-500/20 space-y-1.5">
                <div className="font-bold text-amber-300">🎟️ ડિજિટલ પાસ વેરિફિકેશન</div>
                <p>ગેટ પર માત્ર ઓનલાઇન ક્યૂઆર કોડ પાસ સ્કેન કરીને જ પ્રવેશ આપવામાં આવશે.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-amber-500/20 space-y-1.5">
                <div className="font-bold text-amber-300">🛡️ શિસ્ત અને સંસ્કાર</div>
                <p>પવિત્ર યાત્રાધામ દ્વારકામાં માતાજીની આરાધનાની ગરિમા અને પારિવારિક માહોલ જાળવવો.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REGAL FOOTER
          ========================================================================= */}
      <footer className="relative z-10 border-t-2 border-amber-500/30 bg-[#120103] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Branding */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-[#2a0408]" />
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-200 font-serif">
                    માણેક નવરાત્રી ૨૦૨૬
                  </div>
                  <div className="text-xs text-amber-400 tracking-widest uppercase">
                    Manek Navratri Mahotsav • Devbhumi Dwarka
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-amber-200/70 max-w-md leading-relaxed">
                દેવભૂમિ દ્વારકાનો સૌથી ભવ્ય નવરાત્રી રાસોત્સવ. ધારાસભ્ય શ્રી પબુભા માણેક તથા શ્રી સહદેવ માણેકના માર્ગદર્શન હેઠળ ભક્તિમય અને સુરક્ષિત આયોજન.
              </p>

              <div className="text-xs text-amber-300 font-semibold pt-1">
                ॥ જય શ્રી દ્વારકાધીશ • જય માઁ આશાપુરા • જય બહુચર માં ॥
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <div className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                ઝડપી લિંક્સ (Quick Links)
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-amber-200/75">
                <li>
                  <Link href={REGISTRATION_URL} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pass Registration</span>
                  </Link>
                </li>
                <li>
                  <a href="#singers" className="hover:text-amber-400 transition-colors">
                    Star Artists & Lineup
                  </a>
                </li>
                <li>
                  <a href="#sponsors" className="hover:text-amber-400 transition-colors">
                    Hon. Patrons & Sponsors
                  </a>
                </li>
                <li>
                  <a href="#location" className="hover:text-amber-400 transition-colors">
                    Venue Location & GPS
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact & Venue */}
            <div className="space-y-3">
              <div className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                સ્થળ માહિતી (Event Desk)
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-amber-200/75">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Devbhumi Dwarka, Gujarat, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>11-10-2026 to 19-10-2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Daily 9:00 PM onwards</span>
                </div>
                <div className="pt-2">
                  <a
                    href={GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Credits */}
          <div className="pt-8 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-200/60">
            <div>
              © 2026 Manek Navratri Mahotsav. Devbhumi Dwarka. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link href={REGISTRATION_URL} className="hover:text-amber-300">
                Register Pass
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
