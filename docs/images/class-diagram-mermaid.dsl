
classDiagram


class App{
            #title: WritableSignal~string~
            +ngOnInit() void
        }
OnInit<|..App
class DashboardComponent{
            +issues: Issue[]
+searchTerm: string
+tipoFilter: string
+statoFilter: string
+prioritaFilter: string
+todoPercentage: number
+inProgressPercentage: number
+donePercentage: number
-issueService: IssueService
            +ngOnInit() void
+loadAllIssues() void
+onSearchChange() void
+onTipoFilterChange() void
+onStatoFilterChange() void
+onPrioritaFilterChange() void
+onStatisticsChange() void
        }
OnInit<|..DashboardComponent
class LoginComponent{
            +loginForm: FormGroup~any~
+errorMessage: string
+isLoading: boolean
+showPassword: boolean
-fb: FormBuilder
-authService: AuthService
-router: Router
            +togglePasswordVisibility() void
+onSubmit() void
        }
class ProjectComponent{
            +issues: Issue[]
+projectName: string
+searchTerm: string
+tipoFilter: string
+statoFilter: string
+prioritaFilter: string
+todoPercentage: number
+inProgressPercentage: number
+donePercentage: number
-issueService: IssueService
-route: ActivatedRoute
            +ngOnInit() void
+onSearchChange() void
+onTipoFilterChange() void
+onStatoFilterChange() void
+onPrioritaFilterChange() void
+onStatisticsChange() void
        }
OnInit<|..ProjectComponent
class UsersComponent{
            -userService: UserService
+users: User[]
+searchTerm: string
+roleFilter: string
            +ngOnInit() void
+loadUsers() void
+onSearchChange() void
+onRoleFilterChange() void
        }
OnInit<|..UsersComponent
class ConfirmDialogComponent{
            +dialogRef: MatDialogRef~ConfirmDialogComponent, any~
+data: ConfirmDialogData
            +onCancel() void
+onConfirm() void
        }
class ConfirmDialogData {
            <<interface>>
            +title: string
+message: string
+confirmText?: string
+cancelText?: string
+isDanger?: boolean
            
        }
class EditIssueComponent{
            +content: ElementRef~HTMLDivElement~
+issueId: number
+issue: any
+loading: boolean
+error: string
+uploadedImages: File[]
+imagePreviewUrls: string[]
-route: ActivatedRoute
-router: Router
-issueService: IssueService
-userSubscription: Subscription
-currentUser: #123; email: any; isAdmin: any; #125;
-cdr: ChangeDetectorRef
-authService: AuthService
-toastService: ToastService
            +ngOnInit() void
+onImageError() void
+loadIssueDetail() void
+formatDoc() void
+onImageUpload() void
+triggerImageUpload() void
+removeImage() void
+submitEdit() void
+goBack() void
+getInitials() string
+getFileName() string
+isImage() boolean
+canEditIssue() boolean
+isCompleted() boolean
+getAttachmentUrl() string
+isImageAttachment() boolean
+isPdfAttachment() boolean
+formatFileSize() string
+downloadAttachment() void
        }
OnInit<|..EditIssueComponent
class IssueCardComponent{
            +issue: Issue
-router: Router
            +getInitials() string
+navigateToDetail() void
        }
class Issue {
            <<interface>>
            +id: number
+title: string
+description: string
+tags: string[]
+commentsCount: number
+assignee: string
            
        }
class IssueDetailComponent{
            +content: ElementRef~HTMLDivElement~
+issueId: number
+issue: any
+comments: Comment[]
+loading: boolean
+error: string
+newComment: string
+uploadedImages: File[]
+imagePreviewUrls: string[]
-route: ActivatedRoute
-router: Router
-issueService: IssueService
-userSubscription: Subscription
-currentUser: #123; email: any; isAdmin: any; #125;
-cdr: ChangeDetectorRef
-authService: AuthService
-toastService: ToastService
            +ngOnInit() void
+onImageError() void
+loadIssueDetail() void
+formatDoc() void
+onImageUpload() void
+triggerImageUpload() void
+removeImage() void
+submitComment() void
+goBack() void
+getInitials() string
+getFileName() string
+isImage() boolean
+canEditIssue() boolean
+isCompleted() boolean
+editIssue() void
+completeIssue() void
+getAttachmentUrl() string
+isImageAttachment() boolean
+isPdfAttachment() boolean
+formatFileSize() string
+downloadAttachment() void
        }
class Comment {
            <<interface>>
            +id: number
+author: string
+text: string
+date: Date
+attachments?: #123; id: number; nome_file_originale: string; tipo_mime: string; percorso_relativo: string; dimensione_byte: number; #125;[]
            
        }
OnInit<|..IssueDetailComponent
class IssuesListComponent{
            +issues: Issue[]
+searchTerm: string
+tipoFilter: string
+statoFilter: string
+prioritaFilter: string
+statisticsChange: EventEmitter~#123; todo: number; inProgress: number; done: number; #125;~
+filteredIssues: Issue[]
-statisticsCalculated: boolean
            +ngOnInit() void
+ngOnChanges() void
+applyFilters() void
+calculateStatistics() void
        }
OnInit<|..IssuesListComponent
OnChanges<|..IssuesListComponent
class NewIssueComponent{
            +content: ElementRef~HTMLDivElement~
+cancel: EventEmitter~void~
+confirm: EventEmitter~any~
+title: string
+tipo: string
+priorita: string
+projectName: string
+uploadedImages: File[]
+isLoading: boolean
+imagePreviewUrls: string[]
-router: Router
-route: ActivatedRoute
-projectService: ProjectService
-cdr: ChangeDetectorRef
-toastService: ToastService
            +ngOnInit() void
+formatDoc() void
+onImageUpload() void
+triggerImageUpload() void
+removeImage() void
+onCancel() void
-resetForm() void
+ngOnDestroy() void
+onConfirm() void
        }
OnInit<|..NewIssueComponent
OnDestroy<|..NewIssueComponent
class ProjectDialogComponent{
            +newProjectForm: FormGroup~any~
+errorMessage: string
+isLoading: boolean
+projectData: #123; nome: string; #125;
+dialogRef: MatDialogRef~ProjectDialogComponent, any~
-fb: FormBuilder
            +onSubmit() void
        }
class SidebarComponent{
            +closeSidebar: EventEmitter~void~
+projects: string[]
+filteredProjects: string[]
+searchTerm: string
+selectedProject: string
+hoveredProject: string
+user: User
-userSubscription: Subscription
+isDarkMode: boolean
-router: Router
-projectService: ProjectService
-authService: AuthService
+dialog: MatDialog
-toastService: ToastService
            +onCloseSidebar() void
+getInitials() string
+ngOnInit() void
-extractRole() string
+toggleTheme() void
+navigate() void
+isActive() boolean
+isProjectActive() boolean
+onSearchInput() void
+filterProjects() void
+selectProject() void
+logout() void
+openAddProjectDialog() void
+createProject() void
+openDeleteProjectDialog() void
+deleteProject() void
        }
OnInit<|..SidebarComponent
class ToastComponent{
            +toasts: Toast[]
+copiedIds: Set~string~
-timeouts: Map~string, any~
-toastService: ToastService
            +ngOnInit() void
+removeToast() void
+copyToClipboard() void
+trackByToastId() string
+ngOnDestroy() void
        }
OnInit<|..ToastComponent
OnDestroy<|..ToastComponent
class TopbarComponent{
            +tipo: string
+stato: string
+priorita: string
+searchTerm: string
+tipi: string[]
+stati: string[]
+prioritaListe: string[]
+todoPercentage: number
+inProgressPercentage: number
+donePercentage: number
+tipoFilterChange: EventEmitter~string~
+statoFilterChange: EventEmitter~string~
+prioritaFilterChange: EventEmitter~string~
+searchChange: EventEmitter~string~
+currentRoute: string
+selectedProject: string
-destroy$: Subject~void~
-router: Router
-projectService: ProjectService
            +navigateToNewIssuePage() void
+onTipoChange() void
+onStatoChange() void
+onPrioritaChange() void
+onSearchChange() void
+ngOnInit() void
+ngOnDestroy() void
+isDashboard() boolean
+isProject() boolean
+formatPercentage() string
+getSlicePath() string
        }
OnInit<|..TopbarComponent
OnDestroy<|..TopbarComponent
class UserCardComponent{
            +user: User
+currentUser: User
+deleteUser: EventEmitter~User~
-userSubscription: Subscription
+showDeleteModal: boolean
-authService: AuthService
-toastService: ToastService
            +ngOnInit() void
+getInitials() string
+canDeleteUser() boolean
+onDelete() void
-extractRole() string
        }
class User {
            <<interface>>
            +name: string
+email: string
+role: string
            
        }
OnInit<|..UserCardComponent
class UserDialogComponent{
            +newUserForm: FormGroup~any~
+errorMessage: string
+isLoading: boolean
+userData: #123; nome: string; cognome: string; email: string; ruolo: string; #125;
+dialogRef: MatDialogRef~UserDialogComponent, any~
-fb: FormBuilder
            +onSubmit() void
        }
class UserTopbar{
            +currentUser: User
+searchChange: EventEmitter~string~
+roleFilterChange: EventEmitter~string~
+searchTerm: string
+selectedRole: string
-userSubscription: Subscription
-router: Router
+dialog: MatDialog
-authService: AuthService
-toastService: ToastService
            +ngOnInit() void
+onSearchChange() void
+onRoleFilterChange() void
-extractRole() string
+openAddUserDialog() void
+createUser() void
+canCreateUser() boolean
        }
OnInit<|..UserTopbar
class UserListComponent{
            +users: User[]
+searchTerm: string
+roleFilter: string
+filteredUsers: User[]
-authService: AuthService
-toastService: ToastService
            +ngOnInit() void
+ngOnChanges() void
+applyFilters() void
+onUserDelete() void
        }
OnInit<|..UserListComponent
OnChanges<|..UserListComponent
class AuthService{
            -http: HttpClient
-router: Router
-apiUrl: "http://localhost:3000/api/auth"
-usersApiUrl: "http://localhost:3000/api/users"
-userProfileSubject: BehaviorSubject~any~
+currentUser$: Observable~any~
            +login() Observable~any~
+logout() void
+checkSession() Observable~boolean~
+isAuthenticated() Observable~boolean~
+hasRole() boolean
+register() Observable~any~
+deleteUser() Observable~any~
        }
class KeycloakTokenPayload {
            <<interface>>
            +given_name: string
+family_name: string
+email: string
+realm_access: #123; roles: string[]; #125;
+sub: string
            
        }
class IssueService{
            -http: HttpClient
-apiUrl: string
-commentApiUrl: string
            +getIssuesByProject() Observable~any[]~
+getAllIssues() Observable~any[]~
+getIssueById() Observable~any~
+createComment() Observable~any~
+updateIssue() Observable~any~
+completeIssue() Observable~any~
        }
class ProjectService{
            -apiUrl: "http://localhost:3000/api"
-selectedProjectSubject: BehaviorSubject~string~
+selectedProject$: Observable~string~
-http: HttpClient
            +setSelectedProject() void
+getSelectedProject() string
+createProject() Observable~any~
+getAllProjects() Observable~any[]~
+createIssue() Observable~any~
+deleteProject() Observable~Object~
        }
class ToastService{
            -toastSubject: Subject~Toast~
+toasts$: Observable~Toast~
-idCounter: number
            +show() void
+success() void
+error() void
+info() void
+warning() void
        }
class Toast {
            <<interface>>
            +id: string
+title: string
+message: string
+type: "error" | "success" | "info" | "warning"
+autoDismiss?: boolean
+copyText?: string
            
        }
class UserService{
            -http: HttpClient
-apiUrl: string
            +getAllUsers() Observable~User[]~
        }
class LoginLayoutComponent{
            
            
        }
class MainLayoutComponent{
            +isSidebarOpen: boolean
            +toggleSidebar() void
+closeSidebar() void
        }