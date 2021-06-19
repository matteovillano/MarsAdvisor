/**
 * @swagger
 * /api/resources:
 *  get:
 *      description: descrizione
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              description: api_key per autenticazione
 *              in: query
 *              required: true
 *              type: string
 *          -   name: id
 *              description: id dell'item che si vuole restituito,se inserito i parametri limit, sort e find saranno ignorati
 *              required: false
 *              in: query
 *              type: string
 *          -   name: limit
 *              description: numero massimo di entries che vengono ritornate
 *              required: false
 *              in: query
 *              type: number 
 *          -   name: sort
 *              description: nome del campo per cui si vuole ordinare
 *              required: false
 *              in: query
 *              type: string
 *          -   name: select
 *              description: nomi dei campi che si vogliono restituiti, separati da virgola
 *              required: false
 *              in: query
 *              type: string
 *      responses:
 *          200:
 *              description: richiesta effettuata correttamente, ritornati i valori richiesti
 *          400:
 *              description: richiestta effettuata in modo errato
 *  put:
 *      description: questo metodo serve per modificare il commento di un item presente nel db
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              type: string
 *              required: true
 *              in: query
 *              description: API KEY per l'autenticazione
 *          -   name: body
 *              description: body
 *              in: body
 *              required: true
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: id dell'item che si vuiole eliminare
 *                      comment:
 *                          type: string
 *                          description: nuovo commento da mettere sull'item
 *              
 *      responses:
 *          200:
 *              description: richiesta eseguita correttamente
 *          400:
 *              description: richiesta errata
 *  delete:
 *      description: questo metodo serve per eliminare item dal db
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              type: string
 *              required: true
 *              in: query
 *              description: API KEY per l'autenticazione
 *          -   name: body
 *              description: body
 *              in: body
 *              required: true
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: id dell'item che si vuiole eliminare
 *              
 *      responses:
 *          200:
 *              description: richiesta eseguita correttamente
 *          400:
 *              description: richiesta errata
 *
 * /api/resources/{id}:
 *  get:
 *      description: descrizione
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              description: api_key per autenticazione
 *              in: query
 *              required: true
 *              type: string
 *          -   name: id
 *              description: id dell'item che si vuole restituito,se inserito i parametri limit, sort e find saranno ignorati
 *              required: false
 *              in: path
 *              type: string
 *          -   name: limit
 *              description: numero massimo di entries che vengono ritornate
 *              required: false
 *              in: query
 *              type: number 
 *          -   name: sort
 *              description: nome del campo per cui si vuole ordinare
 *              required: false
 *              in: query
 *              type: string
 *          -   name: select
 *              description: nomi dei campi che si vogliono restituiti, separati da virgola
 *              required: false
 *              in: query
 *              type: string
 *      responses:
 *          200:
 *              description: richiesta effettuata correttamente, ritornati i valori richiesti
 *          400:
 *              description: richiestta effettuata in modo errato
 *
 * /api/resources/apod:
 *  post:
 *      description: questo metodo consente di aggiungere nuovi parametri all'interno del database
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              description: api_key per autenticazione
 *              in: query
 *              required: true
 *              type: string
 *          -   name: body
 *              description: parametri da passare nel body
 *              required: false
 *              in: body
 *              schema:
 *                  type: object
 *                  properties:
 *                      date:
 *                          type: string
 *                          description: data della apod che si vuole aggiungere al db
 *                      comment:
 *                          type: string
 *                          description: commento che si vuole aggiungere all'item una volta salvato nel db
 *                  
 *      responses:
 *          200:
 *              description: richiesta effettuata correttamente
 *          400:
 *              description: richiesta scorretta
 *
 * /api/resources/one:
 *  put:
 *      description: questo metodo serve per modificare il commento di un item presente nel db
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              type: string
 *              required: true
 *              in: query
 *              description: API KEY per l'autenticazione
 *          -   name: body
 *              description: body
 *              in: body
 *              required: true
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: id dell'item che si vuole modificare
 *                      title:
 *                          type: string
 *                          description: titolo dell'item che si vuole modificare
 *                      media_type:
 *                          type: string
 *                          description: media_type dell'item che si vuole modificare
 *                      copyright:
 *                          type: string
 *                          description: copyright dell'item che si vuole modificare
 *                      old_comment:
 *                          type: string
 *                          description: commento dell'item che si vuole modificare
 *                      new_comment:
 *                          type: string
 *                          description: nuovo commento da mettere sull'item
 *              
 *      responses:
 *          200:
 *              description: richiesta eseguita correttamente
 *          400:
 *              description: richiesta errata
 * 
 * 
 *  delete:
 *      description: questo metodo serve per eliminare un item dal db
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              type: string
 *              required: true
 *              in: query
 *              description: API KEY per l'autenticazione
 *          -   name: body
 *              description: body
 *              in: body
 *              required: true
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: id dell'item che si vuiole eliminare
 *                      title:
 *                          type: string
 *                          description: nome dell'item che si vuole eliminare
 *                      comment:
 *                          type: string
 *                          description: commento dell'item che si vuole eliminare
 *                      media_type:
 *                          type: string
 *                          description: media_type dell'item che si vuole eliminare
 *                      copyright:
 *                          type: string
 *                          description: copyright dell'item che si vuole eliminare
 *              
 *      responses:
 *          200:
 *              description: richiesta eseguita correttamente
 *          400:
 *              description: richiesta errata
 *
 * /api/resources/many:
 *  put:
 *      description: questo metodo serve per modificare il commento di un item presente nel db
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              type: string
 *              required: true
 *              in: query
 *              description: API KEY per l'autenticazione
 *          -   name: body
 *              description: body
 *              in: body
 *              required: true
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: id dell'item che si vuole modificare
 *                      title:
 *                          type: string
 *                          description: titolo dell'item che si vuole modificare
 *                      media_type:
 *                          type: string
 *                          description: media_type degli item che si vuole modificare
 *                      copyright:
 *                          type: string
 *                          description: copyright degli item che si vuole modificare
 *                      old_comment:
 *                          type: string
 *                          description: commento dell'item che si vuole modificare
 *                      new_comment:
 *                          type: string
 *                          description: nuovo commento da mettere sull'item
 *              
 *      responses:
 *          200:
 *              description: richiesta eseguita correttamente
 *          400:
 *              description: richiesta errata
 *  delete:
 *      description: questo metodo serve per eliminare più item dal db
 *      tags:
 *        - Resources
 *      parameters:
 *          -   name: api_key
 *              type: string
 *              required: true
 *              in: query
 *              description: API KEY per l'autenticazione
 *          -   name: body
 *              description: body
 *              in: body
 *              required: true
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: id dell'item che si vuiole eliminare
 *                      title:
 *                          type: string
 *                          description: nome dell'item che si vuole eliminare
 *                      comment:
 *                          type: string
 *                          description: commento dell'item che si vuole eliminare
 *                      media_type:
 *                          type: string
 *                          description: media_type degli item che si vogliono eliminare
 *                      copyright:
 *                          type: string
 *                          description: copyright degli item che si vogliono eliminare
 *              
 *      responses:
 *          200:
 *              description: richiesta eseguita correttamente
 *          400:
 *              description: richiesta errata
 * 
 * /api/bodies:
 *  get:
 *      description: Lista corpi celesti supportati
 *      tags:
 *        - Bodies
 *      responses:
 *          200:
 *              description: richiesta effettuata correttamente, ritornati i valori richiesti
 *          400:
 *              description: richiestta effettuata in modo errato
 * 
 * /api/bodies/position_body:
 *  get:
 *      description: Posizione corpo celeste selezionato in base alla posizione dell'utente
 *      tags:
 *        - Bodies
 *      parameters:
 *          -   name: city
 *              type: string
 *              required: true
 *              in: query
 *              description: nome città dell'osservatore 
 *          -   name: corpo
 *              type: string
 *              required: true
 *              in: query
 *              description: nome corpo celeste scelto
 *          -   name: data
 *              type: string 
 *              required: false
 *              in: query
 *              description: data scelta per l'osservazione ( yyyy-mm-dd )
 *          -   name: ora
 *              type: string 
 *              required: false
 *              in: query
 *              description: ora scelta per l'osservazione ( HH:MM:SS )
 *      responses:
 *          200:
 *              description: richiesta effettuata correttamente, ritornati i valori richiesti
 *          400:
 *              description: richiestta effettuata in modo errato
 * 
 * /api/bodies/moon_phase:
 *  post:
 *      description: Genera la url di un'immagine della Luna ripetto alla posizione dell'utente
 *      tags:
 *        - Bodies
 *      parameters:
 *          -   name: body
 *              description: body
 *              in: body
 *              required: true
 *              schema:
 *                  type: object
 *                  required:
 *                      - city
 *                  properties:
 *                      city:
 *                          type: string
 *                          description: nome città dell'osservatore 
 *                      data:
 *                          type: string
 *                          description: data scelta per l'osservazione ( yyyy-mm-dd )
 *      responses:
 *          200:
 *              description: richiesta effettuata correttamente, ritornati i valori richiesti
 *          400:
 *              description: richiestta effettuata in modo errato
 */

