import React from 'react';
import Search from './Search';

const HeroSection = () => {
  return (
    <section
      className="w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] bg-[#fcbb3a] flex flex-col justify-center items-center py-8 sm:py-12 mt-20"
      style={{
        backgroundImage: `repeating-linear-gradient(
          to right,
          #000000 0px,
          #000000 0.5px,
          transparent 0.5px,
          transparent 100px
        )`,
      }}
    >
      {/* Message Box */}
      <div className="bg-white/90 border-2 border-black rounded-xl px-4 sm:px-6 py-4 shadow-md text-center max-w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <p className="text-black text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-snug">
          Discover <span className="text-pink-600">Bold Ideas</span>, <br className="hidden sm:block" />
          Back the Next <span className="text-pink-600">Disruptive Unicorn</span>
        </p>
      </div>

      {/* Subtext */}
      <div className="mt-4 sm:mt-6 max-w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <p className="text-black font-semibold text-lg sm:text-xl lg:text-2xl">
          Showcase Your Vision, <span className="text-pink-600">Let The World Back You.</span>
        </p>
      </div>

      <Search />
    </section>
  );
};

export default HeroSection;
