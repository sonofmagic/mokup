<script setup lang="ts">
import type { ApiKeyLocation, AuthType, BodyType, MultipartFileEntry, PlaygroundRoute, RawBodyType, RouteParamField } from '../types'
import PostmanRequestEditorTabs from './PostmanRequestEditorTabs.vue'
import PostmanRequestHeader from './PostmanRequestHeader.vue'

const props = defineProps<{
  selected: PlaygroundRoute
  requestUrl: string
  workspaceRoot: string
  routeParams: RouteParamField[]
  paramValues: Record<string, string>
  missingParams: string[]
  missingPulse: number
  queryText: string
  headersText: string
  bodyText: string
  bodyType: BodyType
  rawType: RawBodyType
  rawValidate: boolean
  multipartFiles: MultipartFileEntry[]
  binaryFile: File | null
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authKeyName: string
  authKeyValue: string
  authKeyLocation: ApiKeyLocation
  authCustomName: string
  authCustomValue: string
  isSwRegistering: boolean
  configStatusMap: Map<string, 'enabled' | 'disabled'>
}>()

const emit = defineEmits<{
  (event: 'update:queryText', value: string): void
  (event: 'update:headersText', value: string): void
  (event: 'update:bodyText', value: string): void
  (event: 'update:bodyType', value: BodyType): void
  (event: 'update:rawType', value: RawBodyType): void
  (event: 'update:rawValidate', value: boolean): void
  (event: 'update:multipartFiles', value: MultipartFileEntry[]): void
  (event: 'update:binaryFile', value: File | null): void
  (event: 'update:authType', value: AuthType): void
  (event: 'update:authToken', value: string): void
  (event: 'update:authUsername', value: string): void
  (event: 'update:authPassword', value: string): void
  (event: 'update:authKeyName', value: string): void
  (event: 'update:authKeyValue', value: string): void
  (event: 'update:authKeyLocation', value: ApiKeyLocation): void
  (event: 'update:authCustomName', value: string): void
  (event: 'update:authCustomValue', value: string): void
  (event: 'update:param-value', name: string, value: string): void
  (event: 'run'): void
}>()
</script>

<template>
  <section class="rounded border border-pg-border bg-pg-surface-card">
    <PostmanRequestHeader
      :selected="props.selected"
      :request-url="props.requestUrl"
      :headers-text="props.headersText"
      :body-text="props.bodyText"
      :body-type="props.bodyType"
      :raw-type="props.rawType"
      :auth-type="props.authType"
      :auth-token="props.authToken"
      :auth-username="props.authUsername"
      :auth-password="props.authPassword"
      :auth-key-name="props.authKeyName"
      :auth-key-value="props.authKeyValue"
      :auth-key-location="props.authKeyLocation"
      :auth-custom-name="props.authCustomName"
      :auth-custom-value="props.authCustomValue"
      :is-sw-registering="props.isSwRegistering"
      @run="emit('run')"
    />

    <PostmanRequestEditorTabs
      :selected="props.selected"
      :workspace-root="props.workspaceRoot"
      :route-params="props.routeParams"
      :param-values="props.paramValues"
      :missing-params="props.missingParams"
      :missing-pulse="props.missingPulse"
      :query-text="props.queryText"
      :headers-text="props.headersText"
      :body-text="props.bodyText"
      :body-type="props.bodyType"
      :raw-type="props.rawType"
      :raw-validate="props.rawValidate"
      :multipart-files="props.multipartFiles"
      :binary-file="props.binaryFile"
      :auth-type="props.authType"
      :auth-token="props.authToken"
      :auth-username="props.authUsername"
      :auth-password="props.authPassword"
      :auth-key-name="props.authKeyName"
      :auth-key-value="props.authKeyValue"
      :auth-key-location="props.authKeyLocation"
      :auth-custom-name="props.authCustomName"
      :auth-custom-value="props.authCustomValue"
      :config-status-map="props.configStatusMap"
      @update:queryText="emit('update:queryText', $event)"
      @update:headersText="emit('update:headersText', $event)"
      @update:bodyText="emit('update:bodyText', $event)"
      @update:bodyType="emit('update:bodyType', $event)"
      @update:rawType="emit('update:rawType', $event)"
      @update:rawValidate="emit('update:rawValidate', $event)"
      @update:multipartFiles="emit('update:multipartFiles', $event)"
      @update:binaryFile="emit('update:binaryFile', $event)"
      @update:authType="emit('update:authType', $event)"
      @update:authToken="emit('update:authToken', $event)"
      @update:authUsername="emit('update:authUsername', $event)"
      @update:authPassword="emit('update:authPassword', $event)"
      @update:authKeyName="emit('update:authKeyName', $event)"
      @update:authKeyValue="emit('update:authKeyValue', $event)"
      @update:authKeyLocation="emit('update:authKeyLocation', $event)"
      @update:authCustomName="emit('update:authCustomName', $event)"
      @update:authCustomValue="emit('update:authCustomValue', $event)"
      @update:param-value="(name, value) => emit('update:param-value', name, value)"
    />
  </section>
</template>
