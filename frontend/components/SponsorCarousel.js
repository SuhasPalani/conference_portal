// components/SponsorCarousel.js
import React from "react";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Import required modules
import { Navigation, Pagination, Autoplay, A11y } from "swiper/modules";

const SponsorCarousel = () => {
  // Define your sponsor data
  const sponsors = [
    {
      id: 1,
      name: "Tech Innovations Inc.",
      logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARIAAAC4CAMAAAAYGZMtAAAAhFBMVEX///8AAAEAAAD8/PyCgoILCw3j4+PR0dJsbGzZ2dm2trbz8/NMTEzn5+fu7u7e3t6+vr7ExMQ9PT6hoaGtra4VFRaJiYlWVlcjIySlpaWPj49lZWbKysqZmZkuLi9PT095eXpAQEFaWlt8fHw1NTYsLC1oaGhHR0glJSYbGxwtLS5zc3PKOlrCAAALMklEQVR4nO1d6WLyKoVlyYkO/t7/v9O3jRMbGAbIMmC1Fj++X2viBAYWj8FgK7eysLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLDQQb+zHA4Gg+HS995dFQPgtOPFlDDsr2HrnXX6JpzhvUnJqDNa5v67a/Ym9ONzxgWP2+8mg3fX7g3wxhI6AC37f46UWV1NyJ2U7j81fFrrYkLupMTvruffwVUoiPC7df/dVf0jNPjGEx7cO1H73ZX9CzhH2Oy7GYlnYRiOxpOLQMrw3fV9PZwJaHPS/mljCC2rP1tzrBCSzTxeCuc9VX41Fqy9SdPXA7GZrXmT4yScbSbb8yWKDsHkGi8/Tl6ukJHtUl7ImxOOOB5B3PnbOr8WM9rUpG0zdbneRDVJZ6zMPmZ92AaM7Iud2KzAuKSszD9jADkrxsiuWCudxN4qKclIiT9BbakhIeRaXHJwKHO3CScrhRRVCD5jZFFYsDMp9/s3UsZ/VPOXYUGHzbaoz/e/idreIlK61VaUNuskPXUpJ8b+NcX0NNkl5gT/krxR6eXykTLiqgshEUkZ2I3a/axXOf32aIJIaVbYpLRoJ1ELCRKR5IdtiB2IFwa8468uJ/G9HYSo+joSkdTvy+eUZRe626hgGBqN3iHvJIr5F4lIOsmqY41uBDjZV9CgOMPGgdBOIu/oooiMilrqLYAR/npNtV8Hv9EEEwXpysqIIrIpm15jwEn4gmq/Du0din9Iqi+KyERDM13ASYXsib8TbJcghs6ori8iEAPGSbEbNglzgo052eMyD4oIRMjMX0WWO34grlTIhi/zAxEBYOvI7VNr/ipItiaSJo9gkZ+JCEBAu0kVwtaxSAiLLmfwo5+JCEOHdpPJM+v+GjRQa/MXcGMm0BKRfhjPlAb1u9QTG4MxvzVxXUtq3ubLfEtFxBndTM1cEWztU7JNj52AUZO0p9GrfeWUgIQaaCxUIjJYkSz15KKwY42ckpXZtt6FjOxSFoooUYsImI8ICaQTrU8/xOgVsQ8ZyZ5uASVqEdnwvpcsZDlb3fyTR5I3TYGzZQPicH92akoKRaQOkQZbRUkZlYdh3o8YdPa8tUpKyLRIRBAIiQRJyedhMn1FW56DFlPNgD5UNSUlK2McbBV2TZ1LXtDctR8LxJ9ZJR+ihJna1OAfMSlIUk55UWNzUUAgHgyJByhhIpKGGpPPWAaYFM6lbPLCxib87SgjcBtcn5LBntCZ6HCP5Yec86/zLiXOP7og8P9WsC29Nfy1LiU+FBG263tLCeVIYS4lzP+hqbE16ib5RYceJZyIXDm5bO1UkkIpKUjOeCdy/ceBeB1KgBMhpCuIpSgpmUsxvZcsFStTDUpSJ5I39yCVyhmWlJtLGRmuJXTcoPhFKSU+DK+RSJ48giQlcykNw2ecvaJ+JZTgbAFCpvJn3lpgUq6G+5IeHTfIShZS4oyaTFXpi5O8iaKk1OX/0hAM8xZht6GmZM2WM2mUYAPnHHkwbdbnelTOzeV1zfoNZvkjwycC1JTsd7wT8eHPcx1Juf9LQ1fCV5XUFQUHKAFfWdcf7tlg0JOUusHxkp0qxFUcaMyWM0w7ZkBbRINywzDAgmxoVC3IW4JVoDT2eua6Q78BO49cUkJOUsjq2W15ElZ5O7AGFFJCJEmsPpIYCThJMXUOZpTgN4pjr1fZ/DncM1IUkuJ3ASdNM7OR/nu8l2QxESk0JAXujpi5L0y1BIeN1ZNwVODDvQ0YW9KuRJ1QWsTI3a31wzMOH1bB4LY/5JLSaTJOTJQT2nK8kf9gODpHh5tU5JLCaDNy6NBNFeybfkUJKZYUEO01MGRC9zR36I3fUEKiRvHCh57dIRfzNobpDm2E9PVXlDTLXMrC5G4SKcSEUgKesT4lDlj4EImksJQKIRXu/fjK64bSc7/z9oBUtIco4YMq2MqwbHTzJh2WIMEPeRaTrY+4stqUoIUP33Qnyh/F5lkteRo8Wuk5/8aVtWZ1H1SPUpIFaOUjhHaTqXkCy07dILMZg0e8u/X7xylJJOWcfwi/A9A3eOSwEYJPVPRhDDHNKfkJJSwej5pOJx0Db/goSEXtrAmUlMEzKaEbXAbGG1kUJBLXaYMzSMfZPJMS5ojME5N8Kydd0Ym1c6Ck3Mz6kyhhcQkDz94vWUeQnR0CklJ/JiUTc/WVTToKToCk1LWCA3qUGL0P2o8YJztpNwYHTsilKIQ01qeEZt4YuMzhI10raRQRnG3MXYoE4SWTGy1KwvwNM9NM5jAYJt+xE1yKgOU23xfVosQ1upegy2z28rMyvEvBvPVYIuODvcRQStjQyQy8GSIe2AdheeNv/rnA7SEZd5QUhrypHDoUsBZi7uIPEQJzfU09PzWmaMkrWhTrnr9K5SUbHqiInIPuupRsla9YQZaBFFSJCldQMAoEZEF+PmoPQk7U4Pda42XEg1JOTMOAhgmWvT0rRo9XXB+Ybt+gZh6DpRDpSEp9EV6fkDf0NPtkuMrG2sZ9DMm3DT4XrZIU7jRSWjBLCdenZJ1TYqZTY1LnO3PcVpWkTKCVyc8iaVPSor3L0JOgcLe894VHj1RSHOp44fESbUpovq2pl5nQ7Ndb/dpdQVKEWYE6EcKda9SlxPyzsTgZyb2g0VPnR3w7YF2kCd2nLiUNSqihGWuol9SyYcF3lBWTFLacIfhAoyYl7Jx9YUDqnaBawuZcpaSw5Yx4Rk2Xki3tYybGj26QZt60TzJJgSIi3v+qRwk9zU+CFzbqd6Cb4vxDEySlGZ9YFxHPu2pSAm52MXTJVwPuFe2CeoKkqETkDh1DD+7/MfjGjryWotohSaHUSM/Opza9lBKYUGyoTUvBvKS4pkGSgp0ILlovoWQEGDE0iz4DXanL8u1cdLmNTERqYG4uoMQ7AkZwMphZ2ORiIq0mcCkqEYGyo6ZkAO8lnJoZKMlBxUQxvO+SohYRd1oWe+3UltwWmclCksLLL8NWZgUtU0lR3UTP6w2XzkozvMZ8GfNvVvsmpQ9vOJ/LbYRgdCUn9YXolPGM/OJ2L9G7cHGyNTdb5WXqZsageUzo03wszAVF5PbnEf/3OPZ/KxOYee4EAaRUPLBeF9dBaD7yBKOXlNkYGjbC2FHDoD07agTghNg/IRdzFzYI4ABEoMWJJ4ZpRc0cE0SIYhfeTIBborYanJSJSIY9nHfJ7Ra7CsGhVzAScijzUaUici8GXG3Si0ZmnqlXAwydkps0NKP4YKGQ9LxKfnMQdy/hUdnFPeG6dcVeD7jlQYzxVwT87ZVj+e7nbIoYUewI1uCtQpWSEA4NbhlCroLJ9MeX8k2eHJW68FYJxAmJGm7PuX9pR2843wsb6QoRueFUgRirBuZoar3NFJPdYhJEhGAjohQR/qMMDsRrAd+qTQDq/BtSJ0IxZBOwsbs1mujshXWJBIUikgJ8m9vpr6r+MjgN3CFkjBSJSA0eojZ33/cRdMq+P1gVo6eACdfz4qJVwXAtaAdHyanYaIyAwQkqtM4rRvsqkVQwcAoyePs7aPnk8etqwnOPTYLBmqq6xoTz+xW3JBI4nfB7sj9H9WbzHKy/Xf6rdI+SCGo/vnBuz9B08N/C6yfIZlz0hctB3IFK0RssuLFm6smS52KBDD2Juo2ZOxi44ehrj+BfZJOD/sLwgNf3l5516qLUJyGZFNTsgD6pLmmGD5Or5AgDbd/jB/RgfBdDSIh2yrs5z0TtytwVawQfF3hP4JeI5KxclOVk/tPjRkGz12AiYa+PIw/YeH7Y3iDeRd6/v++Zv4/2kE49JaJTwtdd9ip6saEhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhcWf4X9vZYzzmA7lYgAAAABJRU5ErkJggg==",
    },
    {
      id: 2,
      name: "Future AI Solutions",
      logo: "https://via.placeholder.com/200x80/2563EB/FFFFFF?text=Sponsor+B",
    },
    {
      id: 3,
      name: "Global Robotics Co.",
      logo: "https://via.placeholder.com/200x80/BE185D/FFFFFF?text=Sponsor+C",
    },
    {
      id: 4,
      name: "Data Minds Ltd.",
      logo: "https://via.placeholder.com/200x80/16A34A/FFFFFF?text=Sponsor+D",
    },
    {
      id: 5,
      name: "Quantum Computing Partners",
      logo: "https://via.placeholder.com/200x80/D97706/FFFFFF?text=Sponsor+E",
    },
    {
      id: 6,
      name: "Neural Networks Corp.",
      logo: "https://via.placeholder.com/200x80/A78BFA/FFFFFF?text=Sponsor+F",
    },
    {
      id: 7,
      name: "AI Research Group",
      logo: "https://via.placeholder.com/200x80/9D174D/FFFFFF?text=Sponsor+G",
    },
    {
      id: 8,
      name: "Deep Learning Hub",
      logo: "https://via.placeholder.com/200x80/6B7280/FFFFFF?text=Sponsor+H",
    },
    {
      id: 9,
      name: "Cognitive Systems",
      logo: "https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=Sponsor+I",
    },
    {
      id: 10,
      name: "Smart Tech Ventures",
      logo: "https://via.placeholder.com/200x80/06B6D4/FFFFFF?text=Sponsor+J",
    },
    {
      id: 11,
      name: "Innovation Labs",
      logo: "https://via.placeholder.com/200x80/FBBF24/FFFFFF?text=Sponsor+K",
    },
    {
      id: 12,
      name: "NextGen AI",
      logo: "https://via.placeholder.com/200x80/EC4899/FFFFFF?text=Sponsor+L",
    },
    // Add more sponsors as needed
  ];

  return (
    <section id="sponsors" className="py-20 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-5xl font-bold text-white mb-16 animate-fade-in drop-shadow-lg font-montserrat">
          Our Valued Sponsors
        </h2>
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y]}
            spaceBetween={30} // Space between slides
            slidesPerView={1} // Default for mobile
            loop={true} // Infinite loop
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 40,
              },
              1280: {
                slidesPerView: 5, // Show 5 sponsors on large screens
                spaceBetween: 50,
              },
            }}
            className="mySwiper pb-12" // Add padding-bottom for pagination dots
          >
            {sponsors.map((sponsor) => (
              <SwiperSlide
                key={sponsor.id}
                className="flex justify-center items-center"
              >
                <div className="w-52 h-28 bg-gray-800 flex items-center justify-center rounded-xl shadow-lg opacity-90 hover:opacity-100 transition duration-300 transform hover:scale-105">
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="max-w-[80%] max-h-[70%] object-contain filter grayscale hover:grayscale-0 transition duration-300"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Custom navigation buttons (Swiper will style them) */}
          <div className="swiper-button-prev !text-purple-400 !bg-gray-800/50 hover:!bg-gray-700/70 !w-10 !h-10 rounded-full flex items-center justify-center -left-2 top-1/2 -translate-y-1/2 absolute z-10 transition-colors duration-200"></div>
          <div className="swiper-button-next !text-purple-400 !bg-gray-800/50 hover:!bg-gray-700/70 !w-10 !h-10 rounded-full flex items-center justify-center -right-2 top-1/2 -translate-y-1/2 absolute z-10 transition-colors duration-200"></div>
        </div>
      </div>
    </section>
  );
};

export default SponsorCarousel;
