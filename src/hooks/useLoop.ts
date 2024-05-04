
export const timeLoop = (data: { fn: Function, time: number, [key: string]: any }) => {
  const { fn, time } = data
  const timer = setInterval(fn, time)

  return function () {
    clearInterval(timer)
  }
}
