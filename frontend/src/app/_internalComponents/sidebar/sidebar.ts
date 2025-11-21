import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  // Lista progetti
  projects: string[] = [
    'Project 1',
    'Project 2',
    'Project 3',
    'Project 4',
    'Project 5',
    'Project 6',
    'Project 7',
    'Project 8',
    'Project 9',
    'Project 10'
  ];

  // Progetti filtrati in base alla ricerca
  filteredProjects: string[] = [];

  // Termine di ricerca
  searchTerm: string = '';

  // Progetto selezionato
  selectedProject: string | null = null;

  // Informazioni utente
  user = {
    initials: 'MR',
    name: 'Mario Rossi',
    role: 'Amministratore'
  };

  userInitials: string | undefined;
  userName: string | undefined;
  userRole: string | undefined;

  isDarkMode: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Inizializza i progetti filtrati con tutti i progetti
    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.filteredProjects = [...this.projects];
    this.userInitials = this.user.initials;
    this.userName = this.user.name;
    this.userRole = this.user.role;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Salva solo quando l'utente cambia manualmente
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Salva solo quando l'utente cambia manualmente
    }
  }

  /**
   * Naviga verso una rotta specifica
   */
  navigate(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Verifica se la rotta corrente è attiva
   */
  isActive(route: string): boolean {
    return this.router.url === route;
  }

  /**
   * Gestisce l'input della ricerca
   */
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterProjects();
  }

  /**
   * Filtra i progetti in base al termine di ricerca
   */
  filterProjects(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (term === '') {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(project =>
        project.toLowerCase().includes(term)
      );
    }
  }

  /**
   * Seleziona un progetto
   */
  selectProject(project: string): void {
    this.selectedProject = project;
    console.log('Progetto selezionato:', project);

    // Naviga alla pagina del progetto
    this.router.navigate(['/progetto']);
  }

  /**
   * Crea un nuovo progetto
   */
  createNewProject(): void {
    console.log('Creazione nuovo progetto');

    // Logica per aprire un modal o navigare a una pagina di creazione
    // this.router.navigate(['/progetti/nuovo']);
  }

  /**
   * Effettua il logout
   */
  logout(): void {
    console.log('Logout effettuato');

    // Logica per il logout (es. pulizia token, redirect, etc.)
    // Esempio:
    // this.authService.logout();
    // this.router.navigate(['/login']);
  }
}