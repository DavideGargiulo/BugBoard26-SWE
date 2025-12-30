import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../_services/project/project-service';
import { AuthService } from '../../_services/auth/auth.service';
import { User } from '../user-card/user-card';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectDialogComponent } from '../project-dialog/project-dialog';
import { ToastService } from '../../_services/toast/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './sidebar.html'
})

export class SidebarComponent implements OnInit {

  @Output() closeSidebar = new EventEmitter<void>();

  onCloseSidebar() {
    this.closeSidebar.emit();
  }

  // Lista progetti
  projects: string[] = [
    'Test',
  ];

  // Progetti filtrati in base alla ricerca
  filteredProjects: string[] = [];

  // Termine di ricerca
  searchTerm: string = '';

  // Progetto selezionato
  selectedProject: string | null = null;

  // Progetto su cui si sta hovering
  hoveredProject: string | null = null;

  // Informazioni utente
  user: User = {
    name: 'Caricamento...',
    email: '',
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
    @Inject(MatDialog) public dialog: MatDialog,
    private readonly toastService: ToastService
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
          email: '',
          role: this.extractRole(backendUser)
        };
      } else {
        this.user = { name: 'Ospite', email: '', role: '' };
      }
    });
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
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
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
    if (route.startsWith('/progetto/')) {
      return this.router.url.startsWith('/progetto/');
    }
    return this.router.url === route;
  }

  /**
   * Verifica se un progetto specifico è attivo
   */
  isProjectActive(projectName: string): boolean {
    return this.router.url === `/progetto/${projectName}`;
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

    // Naviga alla pagina del progetto con il nome come parametro
    this.router.navigate(['/progetto', project]);
    this.closeSidebar.emit();
  }

  /**
   * Effettua il logout
   */
  logout(): void {
    this.authService.logout();
  }

  openAddProjectDialog(): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '450px',
      maxWidth: '95vw', // Previene overflow orizzontale su mobile
      maxHeight: '90vh', // Previene overflow verticale
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Nome progetto ricevuto:', result);
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

        this.toastService.success(
          'Progetto creato con successo!',
          `Il progetto "${response.nome}" è stato creato.`
        );

      },
      error: (err) => {
        console.error('Errore creazione progetto:', err);
        this.toastService.error(
          'Errore nella creazione del progetto',
          err.error?.error || 'Impossibile creare il progetto'
        );
      }
    });
  }

  /**
   * Apre il dialog di conferma eliminazione
   */
  openDeleteProjectDialog(event: Event, projectName: string): void {
    event.stopPropagation(); // Previene la selezione del progetto

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'custom-dialog-container',
      data: {
        title: 'Elimina Progetto',
        message: `Sei sicuro di voler eliminare il progetto "${projectName}"? Questa azione non può essere annullata.`,
        confirmText: 'Elimina',
        cancelText: 'Annulla',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteProject(projectName);
      }
    });
  }

  /**
   * Elimina un progetto
   */
  deleteProject(projectName: string): void {
    this.projectService.deleteProject(projectName).subscribe({
      next: () => {
        console.log('Progetto eliminato:', projectName);

        // Rimuovi il progetto dalla lista
        this.projects = this.projects.filter(p => p !== projectName);
        this.filterProjects();

        // Se il progetto eliminato era quello selezionato, naviga alla dashboard
        if (this.selectedProject === projectName) {
          this.selectedProject = null;
          this.router.navigate(['/dashboard']);
        }

        this.toastService.success(
          'Progetto eliminato',
          `Il progetto "${projectName}" è stato eliminato con successo.`
        );
      },
      error: (err) => {
        console.error('Errore eliminazione progetto:', err);
        this.toastService.error(
          'Errore nell\'eliminazione del progetto',
          err.error?.error || 'Impossibile eliminare il progetto'
        );
      }
    });
  }
}