import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../_services/project/project-service';
import { AuthService } from '../../_services/auth/auth.service';
import { User } from '../user-card/user-card';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectDialogComponent } from '../project-dialog/project-dialog';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './sidebar.html'
})

export class SidebarComponent implements OnInit {
  // Lista progetti
  projects: string[] = [];

  // Progetti filtrati in base alla ricerca
  filteredProjects: string[] = [];

  // Termine di ricerca
  searchTerm: string = '';

  // Progetto selezionato
  selectedProject: string | null = null;

  // Informazioni utente
  user: User = {
    name: 'Caricamento...',
    role: ''
  };

  private userSubscription: Subscription | null = null;

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  isDarkMode: boolean = false;

  constructor(
    private readonly router: Router,
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
    @Inject(MatDialog) public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects.map(p => p.nome);
        this.filteredProjects = [...this.projects];
      },
      error: (err) => console.error('Errore caricamento progetti:', err)
    });

    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.filteredProjects = [...this.projects];

    this.userSubscription = this.authService.currentUser$.subscribe(backendUser => {
      if (backendUser) {
        this.user = {
          name: backendUser.name || `${backendUser.given_name} ${backendUser.family_name}`,
          role: this.extractRole(backendUser)
        };
      } else {
        this.user = { name: 'Ospite', role: '' };
      }
    });
  }

  loadProjects(): void {
    this.projectService.getAllProjects().subscribe({
      next: (data) => {
        console.log('Progetti caricati:', data);
        this.projects = data.map((project: any) => project.nome);
        this.filteredProjects = [...this.projects];
      },
      error: (err) => {
        console.log('Errore caricamento progetti:', err);
      }
    })
  }

  private extractRole(user: any): string {
    const roles = user.realm_access?.roles || [];

    if (roles.includes('Amministratore')) return 'Amministratore';
    return 'Standard';
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

    this.projectService.setSelectedProject(project);

    // Naviga alla pagina del progetto
    this.router.navigate(['/progetto']);
  }

  /**
   * Effettua il logout
   */
  logout(): void {
    this.authService.logout();
  }


  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '450px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dati utente ricevuti:', result);
        this.createProject(result);
      } else {
        console.log('Dialog chiuso senza conferma');
      }
    });
  }

  createProject(projectData: any): void {
    this.projectService.createProject(projectData).subscribe({
      next: (response: any) => {
        console.log('Progetto creato:', response);

        this.projects.push(response.nome);
        this.filterProjects();

        alert(`Progetto "${response.nome}" creato con successo!`);
      },
      error: (err) => {
        console.error('Errore creazione progetto:', err);
        alert('Errore: ' + (err.error?.error || 'Impossibile creare il progetto'));
      }
    });
  }
}