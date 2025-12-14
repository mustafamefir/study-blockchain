import { useState, useEffect } from "react"
import { useNetworkVariable } from "@/lib/config"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import { IotaObjectData } from "@iota/iota-sdk/client"

export const CONTRACT_MODULE = "contract"
export const CONTRACT_METHODS = {
  CREATE: "create",
  ADD_SESSION: "add_session",
  REMOVE_SESSION: "remove_session",
} as const

function getObjectFields(data: IotaObjectData): { session_count: number; owner: string } | null {
  if (data.content?.dataType !== "moveObject") {
    return null
  }
  const fields = data.content.fields as any
  if (!fields) return null

  let session_count: number
  if (typeof fields.session_count === "string") {
    session_count = parseInt(fields.session_count, 10)
    if (isNaN(session_count)) {
      return null
    }
  } else if (typeof fields.session_count === "number") {
    session_count = fields.session_count
  } else {
    return null
  }
  if (!fields.owner) {
    return null
  }
  const owner = String(fields.owner)
  return {
    session_count,
    owner,
  }
}

export interface ContractData {
  session_count: number
  owner: string
}

export interface ContractActions {
  createObject: () => Promise<void>
  add_session: () => Promise<void>
  remove_session: () => Promise<void>
  clearObject: () => void
}

export const useContract = () => {
  const currentAccount = useCurrentAccount()
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [objectId, setObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  const packageId = useNetworkVariable("packageId")

  const { data, refetch } = useIotaClientQuery(
    ["object", objectId],
    () => iotaClient.getObject({ id: objectId! }),
    {
      enabled: !!objectId && !!packageId,
      retry: false,
    }
  )

  useEffect(() => {
    if (data?.data) {
      setIsConfirmed(true)
    }
  }, [data])

  const fields = data?.data ? getObjectFields(data.data as IotaObjectData) : null

  const createObject = async () => {
    if (!packageId) return
    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CREATE}`,
      })
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            const txResponse = await iotaClient.getTransactionBlock({ digest })
            const createdObjects = txResponse.effects?.created || []
            if (createdObjects.length > 0) {
              setObjectId(createdObjects[0].reference.objectId)
            }
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error creating object:", err)
      setIsLoading(false)
    }
  }

  const add_session = async () => {
    if (!objectId || !packageId) return
    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.ADD_SESSION}`,
      })
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error adding item:", err)
      setIsLoading(false)
    }
  }

  const remove_session = async () => {
    if (!objectId || !packageId) return
    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.REMOVE_SESSION}`,
      })
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error removing item:", err)
      setIsLoading(false)
    }
  }

  const clearObject = () => {
    setObjectId(null)
    setHash(null)
    setIsConfirmed(false)
    setError(null)
    setTransactionError(null)
  }

  const contractData: ContractData | null = fields
    ? {
        session_count: fields.session_count,
        owner: fields.owner,
      }
    : null

  const actions: ContractActions = {
    createObject,
    add_session,
    remove_session,
    clearObject,
  }

  const objectExists = !!data?.data
  const hasValidData = !!fields
  const isOwner = fields?.owner === currentAccount?.address

  return {
    data: contractData,
    actions,
    state: {
      isLoading,
      isPending,
      error: error || transactionError,
      hash,
      isConfirmed,
    },
    objectId,
    isOwner,
    objectExists,
    hasValidData,
  }
}

