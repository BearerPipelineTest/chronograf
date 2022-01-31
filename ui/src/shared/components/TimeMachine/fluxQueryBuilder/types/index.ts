import {
  BuilderAggregateFunctionType,
  RemoteDataState,
  Source,
  TimeRange,
} from 'src/types'

export interface BucketSelectorState {
  selectedBucket?: string
  buckets: string[]
  status: RemoteDataState
  searchTerm: string
}

export interface AggregationSelectorState {
  period: string
  fillMissing: boolean
  selectedFunctions: string[]
}

export const AGG_WINDOW_AUTO = 'auto'

export interface TagSelectorState extends BuilderTagsType {
  tagIndex: number

  keysStatus: RemoteDataState
  keys: string[]
  keysSearchTerm: string

  valuesSearchTerm: string
  valuesStatus?: RemoteDataState
  selectedValues: string[]
}

export interface BuilderTagsType {
  tagKey: string
  values: string[]
  aggregateFunctionType: BuilderAggregateFunctionType
}

export interface QueryBuilderState {
  buckets: BucketSelectorState
  aggregation: AggregationSelectorState
  tags: TagSelectorState[]
}

export interface TimeMachineQueryProps {
  source: Source
  timeRange: TimeRange
}
