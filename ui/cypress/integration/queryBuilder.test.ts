describe('query builder', () => {
  let influxDB: any

  beforeEach(() => {
    cy.toInitialState()
    cy.createInfluxDBConnection().then(() => {
      cy.getByTestID('sidebar')
        .should('be.visible')
        .then(() => {
          cy.createDashboard()
          cy.get('@connections').then((sources: any) => {
            cy.fixture('influxDB.json').then((influxDBData: any) => {
              influxDB = influxDBData

              cy.createInfluxDB(influxDB.db.name, sources[0].id)
              cy.writePoints(
                sources[0].id,
                influxDB.db.name,
                influxDB.db.measurements[0].name,
                influxDB.db.measurements[0].tagValues[0],
                influxDB.db.measurements[0].fieldValues[0]
              )

              cy.writePoints(
                sources[0].id,
                influxDB.db.name,
                influxDB.db.measurements[1].name,
                influxDB.db.measurements[1].tagValues[1],
                influxDB.db.measurements[1].fieldValues[0]
              )
            })

            cy.get('@dashboards').then((dashboards: any) => {
              cy.visit(
                `/sources/${sources[0].id}/dashboards/${dashboards[0].id}`
              )
            })
          })
        })
    })

    cy.get('#Line').click()
    cy.get('.dash-graph').contains('Add Data').click()
    cy.get('.source-selector').within(() => {
      cy.get('@connections').then((sources: any) => {
        cy.get('.dropdown--selected').should('have.text', 'Dynamic Source')
        cy.get('.dropdown--button').click()
        cy.get('.dropdown--menu').contains(sources[0].name).click()
        cy.get('.dropdown--selected').should('have.text', sources[0].name)
      })

      cy.get('button').contains('Flux').click().should('have.class', 'active')
    })

    cy.get('button').contains('Script Builder').click()
  })

  it('create a query, change its aggregation function and fill missing values', () => {
    let queryTemplate: string

    cy.getByTestID('bucket-selector').within(() => {
      cy.get('.flux-query-builder--list-item')
        .contains(influxDB.db.name)
        .click()
    })

    cy.getByTestID('builder-card')
      .eq(0)
      .within(() => {
        cy.get(`#flxts0_${influxDB.db.measurements[0].name}`)
          .should('exist')
          .click({force: true})
      })

    cy.getByTestID('builder-card')
      .eq(1)
      .within(() => {
        cy.get('#flxts1_fieldKey').should('exist').click({force: true})
      })

    const checkQuery = (queryTemplate: string): void => {
      cy.get('.flux-query-builder--actions')
        .contains('Script Editor')
        .click({force: true})

      cy.get('.flux-script-wizard--bg-hint')
        .should('not.exist')
        .then(() => {
          cy.get('.CodeMirror-line').then(lines =>
            expect(lines.text()).to.be.equal(queryTemplate)
          )
        })

      cy.get('button').contains('Script Builder').click({force: true})
    }

    cy.get('.flux-query-builder--actions')
      .contains('Submit')
      .click()
      .then(() => {
        queryTemplate =
          `from(bucket: "${influxDB.db.name}/autogen")` +
          `  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)` +
          `  |> filter(fn: (r) => r["_measurement"] == "${influxDB.db.measurements[0].name}")` +
          `  |> filter(fn: (r) => r["_field"] == "fieldKey")` +
          `  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)` +
          `  |> yield(name: "mean")`

        checkQuery(queryTemplate)
      })

    cy.getByTestID('aggregation-selector').within(() => {
      cy.getByTestID('builder-card--body').within(() => {
        cy.get('.dropdown-selected').click()
        cy.get('.dropdown-menu').within(() => {
          cy.getByTestID('custom-dropdown-item').click()
        })
        cy.get('input').type('13s{enter}')
        cy.get('.dropdown-selected').should('contain.text', '13s')
        cy.get('.slide-toggle').click().should('have.class', 'active')
      })

      cy.get('.builder-card--contents').within(() => {
        cy.get('#flx-agrselectmax').click()
        cy.get('#flx-agrselectmean').click()
      })
    })

    cy.getByTestID('builder-card')
      .eq(2)
      .should('contain.text', 'Filter')
      .within(() => {
        cy.get('.dropdown-selected').contains('Filter').click()
        cy.get('.dropdown-item').contains('Group').click()
        cy.get('.dropdown-selected').should('contain.text', 'Group')
        cy.get('.flux-query-builder--list-item')
          .contains('time')
          .click({force: true})
      })

    cy.get('.flux-query-builder--actions')
      .contains('Submit')
      .click()
      .then(() => {
        queryTemplate =
          `from(bucket: "${influxDB.db.name}/autogen")` +
          `  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)` +
          `  |> filter(fn: (r) => r["_measurement"] == "${influxDB.db.measurements[0].name}")` +
          `  |> filter(fn: (r) => r["_field"] == "fieldKey")` +
          `  |> group(columns: ["_time"])` +
          `  |> aggregateWindow(every: 13s, fn: max, createEmpty: true)` +
          `  |> yield(name: "max")`

        checkQuery(queryTemplate)
      })
  })

  it('use filters to search for tags, activate them and keep track of the selected tags counter', () => {
    cy.getByTestID('bucket-selector').within(() => {
      cy.get('.flux-query-builder--list-item').should('have.length.at.least', 1)
      cy.getByTestID('builder-card--menu').type('Hello World')
      cy.get('.flux-query-builder--list-item').should('not.exist')
      cy.getByTestID('builder-card--menu').clear()
      cy.get('.flux-query-builder--list-item')
        .should('have.length.at.least', 1)
        .and('contain.text', influxDB.db.name)
    })

    cy.getByTestID('builder-card').within(() => {
      cy.get('.flux-tag-selector--count').should('not.exist')
      cy.get('.flux-query-builder--list-item')
        .contains(influxDB.db.measurements[0].name)
        .click({force: true})

      cy.get('.flux-tag-selector--count').should('have.text', 1)
      cy.get('.flux-query-builder--list-item')
        .contains(influxDB.db.measurements[1].name)
        .click({force: true})

      cy.get('.flux-tag-selector--count').should('have.text', 2)
      cy.get('.flux-query-builder--list-item')
        .contains(influxDB.db.measurements[0].name)
        .click({force: true})

      cy.get('.flux-tag-selector--count').should('have.text', 1)
      cy.get('.flux-query-builder--list-item')
        .contains(influxDB.db.measurements[1].name)
        .click({force: true})

      cy.get('.flux-tag-selector--count').should('not.exist')
    })
  })

  it('add and remove building card', () => {
    cy.get('.builder-card--list').within(() => {
      cy.get('.builder-card').should('have.length', 2)
      cy.get('.flux-query-builder--add-card-button').click()
      cy.get('.flux-query-builder--add-card-button').click()

      cy.get('.builder-card')
        .should('have.length', 4)
        .eq(3)
        .within(() => {
          cy.get('.builder-card--delete').click({force: true})
        })
      cy.get('.builder-card')
        .should('have.length', 3)
        .eq(2)
        .within(() => {
          cy.get('.builder-card--delete').click({force: true})
        })
      cy.get('.builder-card').should('have.length', 2)
    })
  })
})
