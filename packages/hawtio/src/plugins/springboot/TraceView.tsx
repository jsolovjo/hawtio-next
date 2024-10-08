import React, { useEffect, useState } from 'react'
import {
  Bullseye,
  Button,
  CodeBlock,
  CodeBlockCode,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Flex,
  FormGroup,
  Label,
  Modal,
  PageSection,
  Pagination,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  EmptyStateHeader,
  Icon,
  Dropdown,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  DropdownList,
} from '@patternfly/react-core'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { CheckCircleIcon, ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons'
import { Trace } from './types'
import { springbootService } from './springboot-service'

const HttpStatusIcon: React.FunctionComponent<{ code: number }> = ({ code }) => {
  if (code < 400)
    return (
      <Icon status='success'>
        <CheckCircleIcon />
      </Icon>
    )
  else
    return (
      <Icon status='danger'>
        <ExclamationCircleIcon />
      </Icon>
    )
}

const HttpMethodLabel: React.FunctionComponent<{ method: string }> = ({ method }) => {
  switch (method) {
    case 'GET':
    case 'HEAD':
      return <Label color='blue'>{method}</Label>
    case 'POST':
      return <Label color='orange'>{method}</Label>
    case 'DELETE':
      return <Label color='red'>{method}</Label>
    case 'PUT':
    case 'PATCH':
      return <Label color='green'>{method}</Label>
    default:
      return <Label color='grey'>{method}</Label>
  }
}

const TraceDetails: React.FunctionComponent<{
  isOpen: boolean
  setIsOpen: (opened: boolean) => void
  traceInfo: string
}> = ({ isOpen, setIsOpen, traceInfo }) => {
  return (
    <Modal
      bodyAriaLabel='Trace detail'
      tabIndex={0}
      isOpen={isOpen}
      variant='large'
      title='Trace'
      onClose={() => setIsOpen(false)}
    >
      <CodeBlock>
        <CodeBlockCode>{traceInfo}</CodeBlockCode>
      </CodeBlock>
    </Modal>
  )
}
export const TraceView: React.FunctionComponent = () => {
  const [traces, setTraces] = useState<Trace[]>([])
  const [filteredTraces, setFilteredTraces] = useState<Trace[]>([])

  const [httpMethodFilter, setMethodFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const [currentTraceFilter, setCurrentTraceFilter] = useState('Timestamp')
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [isHttpMethodFilterDropdownOpen, setIsHttpMethodFilterDropdownOpen] = useState(false)
  const [isTraceDetailsOpen, setIsTraceDetailsOpen] = useState(false)
  const [traceDetails, setTraceDetails] = useState<string>('')

  useEffect(() => {
    springbootService.loadTraces().then(traces => {
      setTraces(traces)
      setFilteredTraces(traces)
    })
  }, [])

  useEffect(() => {
    let filtered: Trace[] = traces.filter(
      trace => httpMethodFilter === 'ALL' || trace.method.toLowerCase().includes(httpMethodFilter.toLowerCase()),
    )

    //filter with the rest of the filters
    ;[...filters, `${currentTraceFilter}: ${searchTerm}`].forEach(value => {
      const attr = value.split(': ')[0] ?? ''
      const searchTerm = value.split(': ')[1] ?? ''
      switch (attr) {
        case 'Timestamp':
          filtered = filtered.filter(trace => trace.timestamp.includes(searchTerm))
          break
        case 'HTTP Status':
          filtered = filtered.filter(trace => trace.httpStatusCode.toString().includes(searchTerm))
          break
        case 'Time Taken':
          filtered = filtered.filter(trace => trace.timeTaken.includes(searchTerm))
          break
        case 'Path':
        default:
          filtered = filtered.filter(trace => trace.path.includes(searchTerm))
          break
      }
    })
    setFilteredTraces(filtered)
  }, [traces, currentTraceFilter, filters, httpMethodFilter, searchTerm])

  const onDeleteFilter = (filter: string) => {
    const newFilters = filters.filter(f => f !== filter)
    setFilters(newFilters)
  }

  const addToFilters = () => {
    setFilters([...filters, `${currentTraceFilter}: ${searchTerm}`])
    setSearchTerm('')
  }

  const clearFilters = () => {
    setFilters([])
    setSearchTerm('')
  }

  const PropsPagination = () => (
    <Pagination
      name={'table-pagination'}
      itemCount={filteredTraces.length}
      page={page}
      perPage={perPage}
      onSetPage={(_evt, value) => setPage(value)}
      onPerPageSelect={(_evt, value) => {
        setPerPage(value)
        setPage(1)
      }}
      variant='top'
    />
  )

  const getTablePage = (): Trace[] => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return filteredTraces.slice(start, end)
  }

  const tableColumns = [
    { key: 'timestamp', value: 'Timestamp' },
    { key: 'httpStatus', value: 'HTTP Status' },
    { key: 'httpMethod', value: 'HTTP Method' },
    { key: 'path', value: 'Path' },
    { key: 'timeTaken', value: 'Time Taken' },
  ]

  const dropdownItems = ['Timestamp', 'HTTP Status', 'Path', 'Time Taken'].map(item => (
    <DropdownItem
      onClick={() => {
        setCurrentTraceFilter(item)
      }}
      key={item + 'key'}
    >
      {item}
    </DropdownItem>
  ))

  const httpMethodsDropdownItems = ['ALL', 'GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'PUT', 'TRACE'].map(
    method => (
      <DropdownItem onClick={() => setMethodFilter(method)} key={'method-' + method}>
        <HttpMethodLabel method={method} />
      </DropdownItem>
    ),
  )

  const TableToolbar = (
    <Toolbar clearAllFilters={clearFilters}>
      <ToolbarContent>
        <ToolbarItem>
          <Dropdown
            data-testid='http-method-select'
            id='http-dropdown'
            onSelect={() => setIsHttpMethodFilterDropdownOpen(false)}
            onOpenChange={setIsHttpMethodFilterDropdownOpen}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                data-testid='http-method-select-toggle'
                id='http-method-toggle'
                onClick={() => setIsHttpMethodFilterDropdownOpen(!isHttpMethodFilterDropdownOpen)}
              >
                <HttpMethodLabel method={httpMethodFilter} />
              </MenuToggle>
            )}
            isOpen={isHttpMethodFilterDropdownOpen}
          >
            <DropdownList>{httpMethodsDropdownItems}</DropdownList>
          </Dropdown>
        </ToolbarItem>
        <ToolbarGroup>
          <Dropdown
            data-testid='attribute-select'
            onSelect={() => setIsFilterDropdownOpen(false)}
            onOpenChange={setIsFilterDropdownOpen}
            defaultValue='HTTP Method'
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                data-testid='attribute-select-toggle'
                id='toggle-basic'
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              >
                {tableColumns.find(att => att.value === currentTraceFilter)?.value}
              </MenuToggle>
            )}
            isOpen={isFilterDropdownOpen}
          >
            <DropdownList>{dropdownItems}</DropdownList>
          </Dropdown>
          <ToolbarFilter
            chips={filters}
            deleteChip={(_e, filter) => onDeleteFilter(filter as string)}
            categoryName='Filters'
          >
            <SearchInput
              type='text'
              data-testid='trace-filter-input'
              id='trace-filter-search-input'
              name='trace-filter-search-input'
              placeholder='Filter...'
              value={searchTerm}
              onChange={(_event, value) => setSearchTerm(value)}
              aria-label='trace-filter-input'
            />
          </ToolbarFilter>
          <ToolbarItem>
            <Button id='add-filter-button' variant='secondary' onClick={addToFilters} size='sm'>
              Add Filter
            </Button>
          </ToolbarItem>
        </ToolbarGroup>

        <ToolbarItem name={'pagination'} variant='pagination'>
          <PropsPagination />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <PageSection>
      <TraceDetails isOpen={isTraceDetailsOpen} setIsOpen={setIsTraceDetailsOpen} traceInfo={traceDetails} />
      {TableToolbar}
      {getTablePage().length > 0 && (
        <FormGroup>
          <Table aria-label='Message Table' variant='compact' height='80vh' isStriped isStickyHeader>
            <Thead>
              <Tr>
                {tableColumns.map((att, index) => (
                  <Th key={'th-key' + index} data-testid={'id-' + att.key}>
                    {att.value}
                  </Th>
                ))}
                <Th> Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {getTablePage().map((trace, index) => {
                return (
                  <Tr key={'row' + index} data-testid={'row' + index}>
                    <Td key={'col-timestamp'}>{trace.timestamp}</Td>
                    <Td key={'col-http-status'}>
                      <Flex>
                        <HttpStatusIcon code={trace.httpStatusCode} />
                        <span>{trace.httpStatusCode}</span>
                      </Flex>
                    </Td>
                    <Td key={'col-http=method'}>
                      <HttpMethodLabel method={trace.method} />
                    </Td>
                    <Td key={'col-path'}>{trace.path}</Td>
                    <Td key={'col-time-taken'}>{trace.timeTaken}</Td>
                    <Td>
                      <Button
                        onClick={_event => {
                          setIsTraceDetailsOpen(true)
                          setTraceDetails(trace.info)
                        }}
                        size='sm'
                      >
                        Show
                      </Button>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </FormGroup>
      )}
      {filteredTraces.length === 0 && (
        <Bullseye>
          <EmptyState>
            <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} />
            <EmptyStateBody>No results found.</EmptyStateBody>
          </EmptyState>
        </Bullseye>
      )}
    </PageSection>
  )
}
