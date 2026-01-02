# BugBoard26-SWE

**BugBoard26** è una web application progettata per la gestione interna delle issue e del tracking dei bug aziendali. La piattaforma offre un flusso di lavoro completo per segnalare, monitorare e risolvere problematiche software, con una gestione avanzata dei permessi tramite ruoli.

---

## Cos'è e come funziona

L'applicazione permette di centralizzare il processo di QA e gestione task. Ecco le funzionalità principali divise per ruolo:

### Funzionalità Generali (Tutti gli utenti)
* **Gestione Issue:** Creazione di ticket con titolo, descrizione dettagliata, tipologia (Bug, Feature, Question, Documentation), priorità e **supporto per allegati immagini**.
* **Collaborazione:** Visualizzazione delle issue e sistema di commenti per discutere le soluzioni.
* **Workflow:** Possibilità di modificare e chiudere le issue (disponibile per l'autore della segnalazione o per gli amministratori).
* **Dashboard e Filtri:** Sistema di filtraggio avanzato per issue e utenti. Include un **grafico a torta** per visualizzare immediatamente la mole di lavoro e lo stato delle issue.

### Funzionalità Amministratore
Gli utenti con ruolo **Admin** hanno accesso a funzionalità di gestione esclusive:
* **Gestione Utenti:** Creazione di nuovi account (assegnando ruoli Standard o Amministratore) ed eliminazione di quelli esistenti.
* **Gestione Progetti:** Creazione ed eliminazione dei progetti a cui le issue fanno riferimento.
* **Supervisione:** Pieni permessi di modifica e chiusura su tutte le issue, indipendentemente dall'autore.

---

## Avvio con Docker Compose

Il modo più rapido per avviare l'intera infrastruttura (Database, Backend, Frontend e Keycloak) è utilizzare Docker.

### Prerequisiti
* [Docker](https://www.docker.com/products/docker-desktop)
* [Docker Compose](https://docs.docker.com/compose/install/)

### Istruzioni passo dopo passo

1.  **Clona la repository:**
    ```bash
    git clone https://github.com/DavideGargiulo/BugBoard26-SWE.git
    cd BugBoard26-SWE
    ```

2.  **Configura le variabili d'ambiente:**
    Rinomina il file `.env.example` in `.env` (o creane uno nuovo) e compila i campi necessari.

3.  **Avvia i container:**
    Esegui il seguente comando nella root del progetto per costruire le immagini e avviare i servizi:
    ```bash
    docker-compose up --build -d
    ```

4.  **Accedi all'applicazione:**
    * **Frontend:** `http://localhost:4200`
    * **Backend:** `http://localhost:3000`
    * **Keycloak (Auth):** `http://localhost:8080`

Per fermare l'applicazione:
```bash
docker-compose down
```

## Contributors

<table align="center">
  <tr >
    <td align="center">
      <a href="https://github.com/DavideGargiulo">
        <img src="https://github.com/DavideGargiulo.png" width="100px;" alt="DavideGargiulo"/>
        <br />
        <sub><b>Davide Gargiulo</b></sub>
      </a>
      <br />
    </td>
    <td align="center">
      <a href="https://github.com/Franwik">
        <img src="https://github.com/Franwik.png" width="100px;" alt="Franwik"/>
        <br />
        <sub><b>Francesco Donnarumma</b></sub>
      </a>
      <br />
    </td>
  </tr>
</table>

## Documentazione

Per visualizzare la documentazione del progetto, cliccare [qui](https://github.com/DavideGargiulo/BugBoard26-SWE/blob/main/docs/main.pdf)

## Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per maggiori dettagli.

## Progetto Universitario

Progetto realizzato per il corso di **Ingegneria del Software**
Anno Accademico 2025/2026
Università degli Studi di Napoli Federico II