import React from 'react';
import Search from './Search';

const HeroSection = () => {
  return (
    <section
      className="w-full min-h-[500px] bg-[#fcbb3a] flex flex-col justify-center items-center"
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
      <div className="bg-white/90 border-2   border-black rounded-xl  px-6 py-4 shadow-md text-center">
        <p className="text-black text-4xl md:text-5xl font-extrabold leading-snug">
          Discover <span className="text-pink-600">Bold Ideas</span>, <br />
          Back the Next <span className="text-pink-600">Disruptive Unicorn</span>
        </p>
      </div>

      {/* Subtext */}
      <div className="mt-6">
        <p className="text-black font-semibold text-xl md:text-2xl">
          Showcase Your Vision, <span className="text-pink-600">Let The World Back You.</span>
        </p>
      </div>

      <Search />
    </section>
  );
};

export default HeroSection;
