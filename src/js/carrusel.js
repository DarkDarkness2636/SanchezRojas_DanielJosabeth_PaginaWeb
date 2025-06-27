// carrusel.js
document.addEventListener('DOMContentLoaded', () => {
  const carrusel = document.getElementById('carrusel');
  const slides = document.querySelectorAll('#carrusel > div');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const indicators = document.querySelectorAll('.indicator');

  let currentIndex = 0;
  const totalSlides = slides.length;

  const updateCarrusel = () => {
    carrusel.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === currentIndex);
      indicator.classList.toggle('bg-white', index === currentIndex);
      indicator.classList.toggle('bg-white/50', index !== currentIndex);
    });
  };

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarrusel();
  });

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateCarrusel();
  });

  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      currentIndex = index;
      updateCarrusel();
    });
  });

  // Autoplay (opcional)
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarrusel();
  }, 5000);
});
