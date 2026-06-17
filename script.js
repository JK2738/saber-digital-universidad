class Libro {
  constructor(titulo, autor, categoria, anio, estado = 'Disponible', lecturas = 0, id = null) {
    this.id = id || 'lib_' + Math.random().toString(36).substr(2, 9);
    this.titulo = titulo.trim();
    this.autor = autor.trim();
    this.categoria = categoria;
    this.anio = parseInt(anio);
    this.estado = estado;
    this.lecturas = parseInt(lecturas);
  }
}

const CATALOGO_INICIAL = [
  new Libro('Don Quijote de la Mancha', 'Miguel de Cervantes', 'Ficción', 1605, 'Disponible', 14),
  new Libro('Cien años de soledad', 'Gabriel García Márquez', 'Literatura', 1967, 'Disponible', 28),
  new Libro('Breve historia del tiempo', 'Stephen Hawking', 'Ciencia', 1988, 'Prestado', 19),
  new Libro('El origen de las especies', 'Charles Darwin', 'Ciencia', 1859, 'Disponible', 9),
  new Libro('Breve historia de la química', 'Isaac Asimov', 'Ciencia', 1965, 'Disponible', 11),
  new Libro('La riqueza de las naciones', 'Adam Smith', 'Historia', 1776, 'Prestado', 6)
];

let libros = [];
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializarTema();
  cargarDatos();
  configurarEventos();
  renderizarTodo();
});

function cargarDatos() {
  const librosGuardados = localStorage.getItem('biblioteca_libros');
  if (librosGuardados) {
    const parsed = JSON.parse(librosGuardados);
    libros = parsed.map(l => new Libro(l.titulo, l.autor, l.categoria, l.anio, l.estado, l.lecturas, l.id));
  } else {
    libros = [...CATALOGO_INICIAL];
    guardarDatos();
  }
}

function guardarDatos() {
  localStorage.setItem('biblioteca_libros', JSON.stringify(libros));
}

function configurarEventos() {
  document.getElementById('search-input').addEventListener('input', renderizarCatalogo);
  document.getElementById('disponibilidad').addEventListener('change', renderizarCatalogo);
  document.getElementById('categoria-filter').addEventListener('change', renderizarCatalogo);
  document.getElementById('anio-filter').addEventListener('input', renderizarCatalogo);

  document.getElementById('form-libro').addEventListener('submit', (e) => {
    e.preventDefault();
    agregarLibro();
  });

  document.getElementById('btn-reporte').addEventListener('click', generarReporteLecturas);

  const themeSwitch = document.getElementById('checkbox');
  themeSwitch.addEventListener('change', alternarTema);
}

function renderizarTodo() {
  actualizarContadores();
  renderizarCatalogo();
  actualizarGrafico();
}

function actualizarContadores() {
  const total = libros.length;
  const prestados = libros.filter(l => l.estado === 'Prestado').length;
  const disponibles = total - prestados;

  document.getElementById('count-total').textContent = total;
  document.getElementById('count-prestados').textContent = prestados;
  document.getElementById('count-disponibles').textContent = disponibles;
}

function renderizarCatalogo() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const filtroDisp = document.getElementById('disponibilidad').value;
  const filtroCat = document.getElementById('categoria-filter').value;
  const filtroAnio = document.getElementById('anio-filter').value;

  const grid = document.getElementById('catalogo-grid');
  grid.innerHTML = '';

  const librosFiltrados = libros.filter(libro => {
    const coincideBusqueda = libro.titulo.toLowerCase().includes(query) || libro.autor.toLowerCase().includes(query);
    const coincideDisp = filtroDisp === 'Todos' || libro.estado === filtroDisp;
    const coincideCat = filtroCat === 'Todas' || libro.categoria === filtroCat;
    const coincideAnio = !filtroAnio || libro.anio === parseInt(filtroAnio);

    return coincideBusqueda && coincideDisp && coincideCat && coincideAnio;
  });

  if (librosFiltrados.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <p class="fs-5 mb-0">No se encontraron libros que coincidan con los filtros seleccionados.</p>
      </div>
    `;
    return;
  }

  librosFiltrados.forEach(libro => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-xxl-4';
    
    const isDisponible = libro.estado === 'Disponible';
    const badgeClass = isDisponible ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning';
    const btnActionText = isDisponible ? 'Prestar' : 'Devolver';
    const btnActionClass = isDisponible ? 'btn-outline-success' : 'btn-outline-warning';

    col.innerHTML = `
      <div class="card h-100 p-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge-category">${libro.categoria}</span>
          <span class="badge ${badgeClass} px-2 py-1 small rounded-pill">${libro.estado}</span>
        </div>
        <h5 class="card-title text-truncate mb-1" title="${libro.titulo}">${libro.titulo}</h5>
        <p class="card-text text-truncate small mb-2">${libro.autor}</p>
        <div class="text-muted small mb-3">Publicado: <strong>${libro.anio}</strong></div>
        
        <div class="d-flex gap-2 mt-auto">
          <button class="btn btn-sm ${btnActionClass} flex-grow-1" onclick="toggleEstado('${libro.id}')" aria-label="${btnActionText} ${libro.titulo}">
            ${btnActionText}
          </button>
          <button class="btn btn-sm btn-light" onclick="verDetalles('${libro.id}')" aria-label="Ver detalles de ${libro.titulo}">
            Detalles
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarLibro('${libro.id}')" aria-label="Eliminar ${libro.titulo}">
            🗑️
          </button>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

window.toggleEstado = function(id) {
  const libro = libros.find(l => l.id === id);
  if (libro) {
    if (libro.estado === 'Disponible') {
      libro.estado = 'Prestado';
      libro.lecturas += 1;
    } else {
      libro.estado = 'Disponible';
    }
    guardarDatos();
    renderizarTodo();
  }
};

window.eliminarLibro = function(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este libro del catálogo?')) {
    libros = libros.filter(l => l.id !== id);
    guardarDatos();
    renderizarTodo();
  }
};

window.verDetalles = function(id) {
  const libro = libros.find(l => l.id === id);
  if (libro) {
    const modalTitle = document.getElementById('modalLibroTitle');
    const modalBody = document.getElementById('modalLibroBody');

    modalTitle.textContent = libro.titulo;
    modalBody.innerHTML = `
      <div class="mb-3"><strong>Autor:</strong> ${libro.autor}</div>
      <div class="mb-3"><strong>Categoría:</strong> ${libro.categoria}</div>
      <div class="mb-3"><strong>Año de Publicación:</strong> ${libro.anio}</div>
      <div class="mb-3"><strong>Estado:</strong> <span class="badge ${libro.estado === 'Disponible' ? 'bg-success' : 'bg-warning'}">${libro.estado}</span></div>
      <div class="mb-0"><strong>Veces Prestado:</strong> ${libro.lecturas}</div>
    `;

    const myModal = new bootstrap.Modal(document.getElementById('modalLibro'));
    myModal.show();
  }
};

function agregarLibro() {
  const titulo = document.getElementById('titulo').value;
  const autor = document.getElementById('autor').value;
  const categoria = document.getElementById('categoria').value;
  const anio = document.getElementById('anio').value;
  const estado = document.getElementById('estado').value;

  const errorAlert = document.getElementById('alert-error');
  errorAlert.classList.add('d-none');

  const existeDuplicado = libros.some(l => 
    l.titulo.toLowerCase() === titulo.trim().toLowerCase() && 
    l.autor.toLowerCase() === autor.trim().toLowerCase()
  );

  if (existeDuplicado) {
    errorAlert.textContent = 'Este libro (mismo título y autor) ya está registrado en el catálogo.';
    errorAlert.classList.remove('d-none');
    return;
  }

  const nuevo = new Libro(titulo, autor, categoria, anio, estado);
  libros.push(nuevo);
  guardarDatos();
  renderizarTodo();

  document.getElementById('form-libro').reset();
}

function generarReporteLecturas() {
  const container = document.getElementById('reporte-container');
  container.innerHTML = '';

  const ordenados = [...libros].sort((a, b) => b.lecturas - a.lecturas);

  ordenados.forEach((l, index) => {
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-2 bg-transparent';
    item.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-success rounded-circle d-flex align-items-center justify-content-center" style="width: 24px; height: 24px; font-size: 0.75rem;">${index + 1}</span>
        <div class="text-truncate" style="max-width: 220px;">
          <div class="fw-bold small text-truncate">${l.titulo}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${l.autor}</div>
        </div>
      </div>
      <span class="badge bg-secondary rounded-pill small">${l.lecturas} leídos</span>
    `;
    container.appendChild(item);
  });
}

function actualizarGrafico() {
  const prestados = libros.filter(l => l.estado === 'Prestado').length;
  const disponibles = libros.length - prestados;

  const ctx = document.getElementById('grafico').getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Disponibles', 'Prestados'],
      datasets: [{
        data: [disponibles, prestados],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
          }
        }
      }
    }
  });
}

function inicializarTema() {
  const temaGuardado = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', temaGuardado);
  
  const themeSwitch = document.getElementById('checkbox');
  const themeLabel = document.getElementById('theme-label');

  if (temaGuardado === 'dark') {
    themeSwitch.checked = true;
    themeLabel.textContent = 'Modo Oscuro';
    document.documentElement.style.setProperty('--theme-close-btn', 'invert(1)');
  } else {
    themeSwitch.checked = false;
    themeLabel.textContent = 'Modo Claro';
    document.documentElement.style.setProperty('--theme-close-btn', 'none');
  }
}

function alternarTema(e) {
  const themeLabel = document.getElementById('theme-label');
  if (e.target.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    themeLabel.textContent = 'Modo Oscuro';
    document.documentElement.style.setProperty('--theme-close-btn', 'invert(1)');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    themeLabel.textContent = 'Modo Claro';
    document.documentElement.style.setProperty('--theme-close-btn', 'none');
  }
  actualizarGrafico();
}
